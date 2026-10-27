import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  pairingRedeemRateLimiter,
  recordFailedRedeemAttempt,
  clearRedeemAttempts,
} from '../middleware/rateLimiter.js';
import {
  generatePairingCode,
  normalizePairingCode,
  hashPairingCode,
  generateDeviceCode,
} from '../utils/pairing.js';

const router = Router();

/**
 * POST /api/pairing/code
 *
 * Generates an unpredictable, cryptographically secure 12-character pairing code
 * for the authenticated parent.
 *
 * Security:
 * - Requires authenticated user with role 'parent'.
 * - Any prior active unused code for this parent is automatically invalidated,
 *   enforcing at most 1 active code per parent and preventing code sprawl.
 * - Stores ONLY the SHA-256 hash in the database (never plaintext).
 * - Code expires in 10 minutes (600 seconds).
 * - Plaintext code is returned only in this response and cannot be retrieved again.
 */
router.post('/code', authenticate, requireRole('parent'), async (req, res) => {
  const parentId = req.user.id;

  try {
    // 1. Invalidate any previously active unused pairing codes for this parent
    await pool.query(
      `UPDATE pairing_codes
       SET used = TRUE
       WHERE parent_id = $1 AND used = FALSE;`,
      [parentId]
    );

    // 2. Generate random pairing code and its SHA-256 hash
    const rawCode = generatePairingCode();
    const codeHash = hashPairingCode(rawCode);

    // 3. Expiration: 10 minutes from current timestamp
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 4. Insert pairing code record
    const insertResult = await pool.query(
      `INSERT INTO pairing_codes (parent_id, code_hash, used, attempt_count, expires_at)
       VALUES ($1, $2, FALSE, 0, $3)
       RETURNING id, expires_at, created_at;`,
      [parentId, codeHash, expiresAt]
    );

    const record = insertResult.rows[0];

    return res.status(201).json({
      message: 'Pairing code generated successfully.',
      code: rawCode,
      expiresAt: record.expires_at,
      expiresInSeconds: 600,
    });
  } catch (err) {
    console.error('[Pairing Code Generation Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate pairing code. Please try again.',
    });
  }
});

/**
 * GET /api/pairing/code
 *
 * Checks if the authenticated parent currently has an active, unexpired pairing code.
 * Does not return the raw code (which is only shown upon generation).
 */
router.get('/code', authenticate, requireRole('parent'), async (req, res) => {
  const parentId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, expires_at, created_at
       FROM pairing_codes
       WHERE parent_id = $1 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1;`,
      [parentId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ active: false });
    }

    const row = result.rows[0];
    const remainingMs = new Date(row.expires_at).getTime() - Date.now();

    return res.status(200).json({
      active: true,
      expiresAt: row.expires_at,
      remainingSeconds: Math.max(0, Math.floor(remainingMs / 1000)),
    });
  } catch (err) {
    console.error('[Pairing Code Status Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check pairing code status.',
    });
  }
});

/**
 * POST /api/pairing/redeem
 *
 * Redeems a pairing code from an authenticated student account.
 *
 * Security:
 * - Requires authenticated user with role 'student'.
 * - Executes atomically in a database transaction with FOR UPDATE row locking
 *   to eliminate race conditions and double-redemption.
 * - Enforces attempt limits, expiration, and single-use constraints.
 * - Associates student with the parent who generated the code without
 *   accepting any client-supplied parent ID.
 * - Prevents linking a student to a different parent if already paired.
 * - Creates a hardware device record in 'offline' state without fabricating monitoring data.
 */
router.post(
  '/redeem',
  authenticate,
  requireRole('student'),
  pairingRedeemRateLimiter,
  async (req, res) => {
    const studentUserId = req.user.id;
    const { code, deviceName, deviceType, model } = req.body || {};

    // 1. Input Validation
    if (!code || typeof code !== 'string') {
      recordFailedRedeemAttempt(req);
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A pairing code is required.',
      });
    }

    const normalized = normalizePairingCode(code);
    if (normalized.length < 8) {
      recordFailedRedeemAttempt(req);
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid pairing code format.',
      });
    }

    // Validate device type
    const allowedTypes = ['laptop', 'desktop', 'tablet', 'phone', 'other'];
    const validDeviceType = allowedTypes.includes(deviceType) ? deviceType : 'laptop';
    const validDeviceName =
      typeof deviceName === 'string' && deviceName.trim().length > 0
        ? deviceName.trim().slice(0, 100)
        : 'Student Device';
    const validModel =
      typeof model === 'string' && model.trim().length > 0
        ? model.trim().slice(0, 100)
        : null;

    const codeHash = hashPairingCode(normalized);

    // 2. Atomic Transaction Execution
    const client = await pool.connect();
    try {
      await client.query('BEGIN;');

      // Find and lock the pairing code row
      const codeQuery = await client.query(
        `SELECT id, parent_id, used, attempt_count, expires_at
         FROM pairing_codes
         WHERE code_hash = $1
         FOR UPDATE;`,
        [codeHash]
      );

      if (codeQuery.rows.length === 0) {
        await client.query('ROLLBACK;');
        recordFailedRedeemAttempt(req);
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid or unrecognized pairing code. Please verify the code and try again.',
        });
      }

      const codeRecord = codeQuery.rows[0];

      // Check attempt-limit lockout
      if (codeRecord.attempt_count >= 5) {
        await client.query('ROLLBACK;');
        recordFailedRedeemAttempt(req);
        return res.status(400).json({
          error: 'Bad Request',
          message: 'This pairing code has been locked due to too many failed attempts.',
        });
      }

      // Check if already used
      if (codeRecord.used) {
        await client.query('ROLLBACK;');
        recordFailedRedeemAttempt(req);
        return res.status(400).json({
          error: 'Bad Request',
          message: 'This pairing code has already been redeemed.',
        });
      }

      // Check expiration
      const now = new Date();
      if (new Date(codeRecord.expires_at) <= now) {
        await client.query('ROLLBACK;');
        recordFailedRedeemAttempt(req);
        return res.status(400).json({
          error: 'Bad Request',
          message: 'This pairing code has expired. Please ask your parent to generate a new code.',
        });
      }

    // Check if this student already has a student profile
    const existingProfileRes = await client.query(
      `SELECT id, user_id, parent_id, grade, school, initials, daily_goal_mins
       FROM student_profiles
       WHERE user_id = $1
       FOR UPDATE;`,
      [studentUserId]
    );

    let profileId;
    let studentInitials;

    if (existingProfileRes.rows.length > 0) {
      const existingProfile = existingProfileRes.rows[0];
      // Prevent student from being linked to a different parent
      if (existingProfile.parent_id !== codeRecord.parent_id) {
        await client.query('ROLLBACK;');
        recordFailedRedeemAttempt(req);
        return res.status(409).json({
          error: 'Conflict',
          message:
            'This student account is already paired with a different parent account.',
        });
      }
      profileId = existingProfile.id;
      studentInitials = existingProfile.initials;
    } else {
      // Create student_profile for this student linked to the code's parent
      const userRes = await client.query(
        `SELECT display_name FROM users WHERE id = $1;`,
        [studentUserId]
      );
      const studentDisplayName = userRes.rows[0]?.display_name || 'Student';
      studentInitials = studentDisplayName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'ST';

      const createProfileRes = await client.query(
        `INSERT INTO student_profiles (user_id, parent_id, initials, daily_goal_mins)
         VALUES ($1, $2, $3, 120)
         RETURNING id, initials;`,
        [studentUserId, codeRecord.parent_id, studentInitials]
      );
      profileId = createProfileRes.rows[0].id;
    }

    // Create device record associated with parent and student
    const deviceCode = generateDeviceCode();
    const insertDeviceRes = await client.query(
      `INSERT INTO devices (parent_id, student_id, name, device_type, model, device_code, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'offline')
       RETURNING id, parent_id, student_id, name, device_type, model, device_code, status, created_at;`,
      [codeRecord.parent_id, profileId, validDeviceName, validDeviceType, validModel, deviceCode]
    );
    const newDevice = insertDeviceRes.rows[0];

    // Mark pairing code as used
    await client.query(
      `UPDATE pairing_codes
       SET used = TRUE
       WHERE id = $1;`,
      [codeRecord.id]
    );

    // Commit transaction
    await client.query('COMMIT;');

    // Reset rate limiter failed attempt tracker upon successful pairing
    clearRedeemAttempts(req);

    // Retrieve parent display name for safe confirmation response
    const parentUserRes = await pool.query(
      `SELECT display_name, email FROM users WHERE id = $1;`,
      [codeRecord.parent_id]
    );
    const parentInfo = parentUserRes.rows[0] || {};

    return res.status(200).json({
      message: 'Device paired successfully with parent account.',
      parent: {
        displayName: parentInfo.display_name || 'Parent',
        email: parentInfo.email,
      },
      device: {
        id: newDevice.id,
        name: newDevice.name,
        deviceType: newDevice.device_type,
        model: newDevice.model,
        deviceCode: newDevice.device_code,
        status: newDevice.status,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK;').catch(() => {});
    console.error('[Pairing Redemption Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while redeeming pairing code.',
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/pairing/student-status
 *
 * Returns pairing status for the currently authenticated student.
 */
router.get('/student-status', authenticate, requireRole('student'), async (req, res) => {
  const studentUserId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
         sp.id AS profile_id,
         sp.parent_id,
         sp.initials,
         sp.grade,
         sp.school,
         p.display_name AS parent_name,
         p.email AS parent_email,
         d.id AS device_id,
         d.name AS device_name,
         d.device_type AS device_type,
         d.device_code AS device_code,
         d.status AS device_status
       FROM student_profiles sp
       JOIN users p ON sp.parent_id = p.id
       LEFT JOIN devices d ON d.student_id = sp.id
       WHERE sp.user_id = $1 AND sp.deleted_at IS NULL
       ORDER BY d.created_at DESC
       LIMIT 1;`,
      [studentUserId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        isPaired: false,
      });
    }

    const row = result.rows[0];
    return res.status(200).json({
      isPaired: true,
      parent: {
        displayName: row.parent_name,
        email: row.parent_email,
      },
      profile: {
        id: row.profile_id,
        initials: row.initials,
        grade: row.grade,
        school: row.school,
      },
      device: row.device_id
        ? {
            id: row.device_id,
            name: row.device_name,
            deviceType: row.device_type,
            deviceCode: row.device_code,
            status: row.device_status,
          }
        : null,
    });
  } catch (err) {
    console.error('[Pairing Student Status Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve student pairing status.',
    });
  }
});

export default router;
