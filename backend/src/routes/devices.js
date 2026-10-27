import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/devices
 *
 * Retrieves hardware devices paired to the authenticated parent account.
 *
 * Security:
 * - Requires authentication with role 'parent'.
 * - Enforces strict ownership check (d.parent_id = req.user.id).
 *   Client-supplied IDs are never trusted.
 * - Accurately surfaces real device status (e.g. 'offline') without
 *   fabricating synthetic telemetry or monitoring data.
 */
router.get('/', authenticate, requireRole('parent'), async (req, res) => {
  const parentId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
         d.id,
         d.parent_id AS "parentId",
         d.student_id AS "studentId",
         d.name,
         d.device_type AS "deviceType",
         d.model,
         d.device_code AS "deviceCode",
         d.agent_version AS "agentVersion",
         d.status,
         d.last_seen_at AS "lastSeenAt",
         d.created_at AS "createdAt",
         d.updated_at AS "updatedAt",
         sp.initials AS "studentInitials",
         sp.grade AS "studentGrade",
         u.display_name AS "studentName",
         u.email AS "studentEmail"
       FROM devices d
       LEFT JOIN student_profiles sp ON d.student_id = sp.id
       LEFT JOIN users u ON sp.user_id = u.id
       WHERE d.parent_id = $1
       ORDER BY d.created_at DESC;`,
      [parentId]
    );

    return res.status(200).json({
      devices: result.rows,
      totalCount: result.rows.length,
    });
  } catch (err) {
    console.error('[Devices Fetch Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve paired devices.',
    });
  }
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * DELETE /api/devices/:id
 *
 * Secure parent-controlled deactivation/decommissioning of an existing device.
 *
 * Security & Integrity:
 * - Restricted to authenticated 'parent' role.
 * - Enforces strict ownership check (d.parent_id = req.user.id).
 * - Students cannot access this endpoint or unlink devices.
 * - Preserves historical study-session records (device_id becomes NULL via ON DELETE SET NULL).
 * - Preserves the parent-student relationship in student_profiles.
 * - Decommissioned device is removed so it cannot submit telemetry in Phase 4.
 */
router.delete('/:id', authenticate, requireRole('parent'), async (req, res) => {
  const parentId = req.user.id;
  const deviceId = req.params.id;

  if (!deviceId || !UUID_REGEX.test(deviceId)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid device ID format. A valid UUID is required.',
    });
  }

  try {
    // 1. Verify existence and ownership
    const checkRes = await pool.query(
      `SELECT id, parent_id, name, device_code
       FROM devices
       WHERE id = $1;`,
      [deviceId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Device not found.',
      });
    }

    const device = checkRes.rows[0];
    if (device.parent_id !== parentId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: you do not own this device.',
      });
    }

    // 2. Delete device (study_sessions.device_id becomes NULL via ON DELETE SET NULL)
    await pool.query(
      `DELETE FROM devices
       WHERE id = $1 AND parent_id = $2;`,
      [deviceId, parentId]
    );

    return res.status(200).json({
      message: 'Device decommissioned successfully.',
      device: {
        id: device.id,
        name: device.name,
        deviceCode: device.device_code,
      },
    });
  } catch (err) {
    console.error('[Device Decommission Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to decommission device.',
    });
  }
});

/**
 * POST /api/devices/:id/heartbeat
 *
 * Records a liveness ping from the student's device.
 * Sets last_seen_at = NOW() and status = 'online'.
 *
 * Security:
 * - Restricted to authenticated 'student' role only.
 * - Student profile ID is derived strictly from req.user.id via student_profiles.
 * - Verifies d.student_id = studentProfileId — students cannot heartbeat devices
 *   they don't own.
 * - Parent identity is never required or consulted here.
 */
router.post('/:id/heartbeat', authenticate, requireRole('student'), async (req, res) => {
  const studentUserId = req.user.id;
  const deviceId = req.params.id;

  if (!deviceId || !UUID_REGEX.test(deviceId)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid device ID format. A valid UUID is required.',
    });
  }

  try {
    // 1. Derive student_profiles.id from the authenticated user
    const profileRes = await pool.query(
      `SELECT id FROM student_profiles WHERE user_id = $1 AND deleted_at IS NULL;`,
      [studentUserId]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student profile not found. Please pair your account before sending a heartbeat.',
      });
    }

    const studentProfileId = profileRes.rows[0].id;

    // 2. Update the device, enforcing ownership via student_id
    const updateRes = await pool.query(
      `UPDATE devices
       SET
         last_seen_at = NOW(),
         status       = 'online',
         updated_at   = NOW()
       WHERE id = $1
         AND student_id = $2
       RETURNING
         id,
         name,
         status,
         last_seen_at  AS "lastSeenAt",
         updated_at    AS "updatedAt";`,
      [deviceId, studentProfileId]
    );

    if (updateRes.rows.length === 0) {
      // Either the device doesn't exist or doesn't belong to this student
      return res.status(404).json({
        error: 'Not Found',
        message: 'Device not found or does not belong to your account.',
      });
    }

    return res.status(200).json({
      message: 'Heartbeat recorded.',
      device: updateRes.rows[0],
    });
  } catch (err) {
    console.error('[Device Heartbeat Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to record device heartbeat.',
    });
  }
});

export default router;

