import { Router } from 'express';
import { pool } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * Handler for starting a study session.
 *
 * Security:
 * - Requires authenticated user with role 'student'.
 * - Student profile ID is strictly derived from req.user.id via student_profiles table.
 * - Client-supplied student IDs are never accepted or trusted.
 * - Associated device ID is validated to belong to the student profile if supplied.
 */
async function handleStartSession(req, res) {
  const studentUserId = req.user.id;
  const { title, subject, goalText, notes, deviceId } = req.body || {};

  try {
    // 1. Derive student_profiles.id from authenticated user
    const profileRes = await pool.query(
      `SELECT id FROM student_profiles WHERE user_id = $1 AND deleted_at IS NULL;`,
      [studentUserId]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student profile not found. Please pair your account before starting a session.',
      });
    }

    const studentProfileId = profileRes.rows[0].id;

    // 2. Resolve device_id if provided or default to student's paired device
    let resolvedDeviceId = null;
    if (deviceId) {
      const deviceCheck = await pool.query(
        `SELECT id FROM devices WHERE id = $1 AND student_id = $2;`,
        [deviceId, studentProfileId]
      );
      if (deviceCheck.rows.length > 0) {
        resolvedDeviceId = deviceCheck.rows[0].id;
      }
    } else {
      const defaultDevice = await pool.query(
        `SELECT id FROM devices WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1;`,
        [studentProfileId]
      );
      if (defaultDevice.rows.length > 0) {
        resolvedDeviceId = defaultDevice.rows[0].id;
      }
    }

    // 3. Prepare sanitized inputs
    const trimmedSubject =
      typeof subject === 'string' && subject.trim()
        ? subject.trim().slice(0, 100)
        : 'General Study';

    const trimmedGoal =
      typeof goalText === 'string' && goalText.trim()
        ? goalText.trim().slice(0, 500)
        : null;

    const trimmedTitle =
      typeof title === 'string' && title.trim()
        ? title.trim().slice(0, 200)
        : trimmedGoal
          ? trimmedGoal.slice(0, 200)
          : `${trimmedSubject} Focus Session`;

    const trimmedNotes =
      typeof notes === 'string' && notes.trim()
        ? notes.trim().slice(0, 1000)
        : null;

    // 4. Insert study session
    const insertRes = await pool.query(
      `INSERT INTO study_sessions (
         student_id,
         device_id,
         title,
         subject,
         status,
         goal_text,
         notes,
         is_user_recorded
       ) VALUES ($1, $2, $3, $4, 'active', $5, $6, TRUE)
       RETURNING
         id,
         student_id AS "studentId",
         device_id AS "deviceId",
         title,
         subject,
         status,
         started_at AS "startedAt",
         ended_at AS "endedAt",
         duration_seconds AS "durationSeconds",
         focus_score AS "focusScore",
         goal_text AS "goalText",
         notes,
         primary_app AS "primaryApp",
         category,
         distraction_count AS "distractionCount",
         is_user_recorded AS "isUserRecorded",
         created_at AS "createdAt";`,
      [studentProfileId, resolvedDeviceId, trimmedTitle, trimmedSubject, trimmedGoal, trimmedNotes]
    );

    const session = insertRes.rows[0];

    return res.status(201).json({
      message: 'Study session started successfully.',
      session,
    });
  } catch (err) {
    console.error('[Start Study Session Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to start study session.',
    });
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Support both POST /api/sessions and POST /api/sessions/start
router.post('/', authenticate, requireRole('student'), handleStartSession);
router.post('/start', authenticate, requireRole('student'), handleStartSession);

/**
 * Handler for ending an active study session.
 *
 * Security:
 * - Requires authenticated user with role 'student'.
 * - Verifies session exists and strictly belongs to the student's profile.
 * - Enforces that the session is currently active (rejects already completed/cancelled sessions).
 * - Accurately computes duration server-side and enforces ended_at > started_at.
 */
async function handleEndSession(req, res) {
  const studentUserId = req.user.id;
  const sessionId = req.params.id;
  const { notes, status } = req.body || {};

  // 1. Validate session UUID
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid session ID format. A valid UUID is required.',
    });
  }

  try {
    // 2. Derive student_profiles.id for authenticated student
    const profileRes = await pool.query(
      `SELECT id FROM student_profiles WHERE user_id = $1 AND deleted_at IS NULL;`,
      [studentUserId]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student profile not found. Please pair your account before ending a session.',
      });
    }

    const studentProfileId = profileRes.rows[0].id;

    // 3. Look up study session
    const sessionRes = await pool.query(
      `SELECT id, student_id, started_at, ended_at, status, notes
       FROM study_sessions
       WHERE id = $1;`,
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Study session not found.',
      });
    }

    const session = sessionRes.rows[0];

    // 4. Verify ownership
    if (session.student_id !== studentProfileId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: you do not own this study session.',
      });
    }

    // 5. Reject already-ended or inactive sessions
    if (session.status !== 'active') {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Study session cannot be ended because it is already ${session.status}.`,
      });
    }

    // 6. Calculate end time and duration server-side
    const startedAt = new Date(session.started_at);
    const now = new Date();
    // Guarantee ended_at > started_at to satisfy chk_session_end_after_start constraint
    const endedAt = now > startedAt ? now : new Date(startedAt.getTime() + 1000);
    const durationSeconds = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));

    // Target status: completed (or cancelled if requested)
    const validStatus = status === 'cancelled' ? 'cancelled' : 'completed';
    const trimmedNotes = typeof notes === 'string' && notes.trim() ? notes.trim().slice(0, 1000) : null;

    // 7. Update session
    const updateRes = await pool.query(
      `UPDATE study_sessions
       SET
         ended_at = $1,
         duration_seconds = $2,
         status = $3,
         notes = COALESCE($4, notes)
       WHERE id = $5 AND student_id = $6
       RETURNING
         id,
         student_id AS "studentId",
         device_id AS "deviceId",
         title,
         subject,
         status,
         started_at AS "startedAt",
         ended_at AS "endedAt",
         duration_seconds AS "durationSeconds",
         focus_score AS "focusScore",
         goal_text AS "goalText",
         notes,
         primary_app AS "primaryApp",
         category,
         distraction_count AS "distractionCount",
         is_user_recorded AS "isUserRecorded",
         created_at AS "createdAt";`,
      [endedAt, durationSeconds, validStatus, trimmedNotes, sessionId, studentProfileId]
    );

    const updatedSession = updateRes.rows[0];

    return res.status(200).json({
      message: 'Study session ended successfully.',
      session: updatedSession,
    });
  } catch (err) {
    console.error('[End Study Session Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to end study session.',
    });
  }
}

// Support POST and PATCH /api/sessions/:id/end
router.post('/:id/end', authenticate, requireRole('student'), handleEndSession);
router.patch('/:id/end', authenticate, requireRole('student'), handleEndSession);

/**
 * Handler for fetching a student's session history.
 *
 * Security:
 * - Requires authenticated user with role 'student'.
 * - Student profile ID is strictly derived from req.user.id via student_profiles table.
 * - Client-supplied student IDs are never accepted or trusted.
 *
 * Returns sessions ordered by started_at DESC (newest first).
 * Supports optional query params:
 *   - limit  (default 50, max 200)
 *   - offset (default 0)
 */
async function handleGetSessions(req, res) {
  const studentUserId = req.user.id;

  // Parse and clamp pagination params
  const rawLimit = parseInt(req.query.limit, 10);
  const rawOffset = parseInt(req.query.offset, 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

  try {
    // 1. Derive student_profiles.id from authenticated user
    const profileRes = await pool.query(
      `SELECT id FROM student_profiles WHERE user_id = $1 AND deleted_at IS NULL;`,
      [studentUserId]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student profile not found. Please pair your account before viewing sessions.',
      });
    }

    const studentProfileId = profileRes.rows[0].id;

    // 2. Fetch sessions for this student, newest first
    const sessionsRes = await pool.query(
      `SELECT
         id,
         student_id        AS "studentId",
         device_id         AS "deviceId",
         title,
         subject,
         status,
         started_at        AS "startedAt",
         ended_at          AS "endedAt",
         duration_seconds  AS "durationSeconds",
         focus_score       AS "focusScore",
         goal_text         AS "goalText",
         notes,
         primary_app       AS "primaryApp",
         category,
         distraction_count AS "distractionCount",
         is_user_recorded  AS "isUserRecorded",
         created_at        AS "createdAt"
       FROM study_sessions
       WHERE student_id = $1
       ORDER BY started_at DESC
       LIMIT $2 OFFSET $3;`,
      [studentProfileId, limit, offset]
    );

    // 3. Return total count alongside the page for pagination support
    const countRes = await pool.query(
      `SELECT COUNT(*) AS total FROM study_sessions WHERE student_id = $1;`,
      [studentProfileId]
    );
    const total = parseInt(countRes.rows[0].total, 10);

    return res.status(200).json({
      sessions: sessionsRes.rows,
      pagination: { total, limit, offset },
    });
  } catch (err) {
    console.error('[Get Sessions Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch study sessions.',
    });
  }
}

router.get('/', authenticate, requireRole('student'), handleGetSessions);

/**
 * Handler for recording a single activity event for a study session.
 *
 * Endpoint: POST /api/sessions/:id/events
 *
 * Security:
 * - Requires authenticated user with role 'student'.
 * - Student profile ID is strictly derived from req.user.id — never from the body.
 * - Verifies the target session's student_id matches the authenticated student's
 *   profile ID before inserting — prevents cross-student log injection.
 *
 * Validation:
 * - Session ID must be a valid UUID.
 * - event field must be a non-empty string, max 500 chars.
 *
 * Uses the existing session_logs table (id, session_id, logged_at, event).
 * No migration required.
 */
async function handleRecordEvent(req, res) {
  const studentUserId = req.user.id;
  const sessionId = req.params.id;

  // 1. Validate session UUID
  if (!sessionId || !UUID_REGEX.test(sessionId)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid session ID format. A valid UUID is required.',
    });
  }

  // 2. Validate and sanitize event field
  const { event } = req.body || {};
  if (!event || typeof event !== 'string' || !event.trim()) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'event is required and must be a non-empty string.',
    });
  }
  const trimmedEvent = event.trim().slice(0, 500);

  try {
    // 3. Derive student_profiles.id from authenticated user
    const profileRes = await pool.query(
      `SELECT id FROM student_profiles WHERE user_id = $1 AND deleted_at IS NULL;`,
      [studentUserId]
    );

    if (profileRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Student profile not found.',
      });
    }

    const studentProfileId = profileRes.rows[0].id;

    // 4. Verify the session exists and belongs to this student
    const sessionRes = await pool.query(
      `SELECT id FROM study_sessions WHERE id = $1 AND student_id = $2;`,
      [sessionId, studentProfileId]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Study session not found or does not belong to your account.',
      });
    }

    // 5. Insert one event row into session_logs
    const insertRes = await pool.query(
      `INSERT INTO session_logs (session_id, event)
       VALUES ($1, $2)
       RETURNING
         id,
         session_id AS "sessionId",
         logged_at  AS "loggedAt",
         event;`,
      [sessionId, trimmedEvent]
    );

    return res.status(201).json({
      message: 'Activity event recorded.',
      log: insertRes.rows[0],
    });
  } catch (err) {
    console.error('[Record Activity Event Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to record activity event.',
    });
  }
}

router.post('/:id/events', authenticate, requireRole('student'), handleRecordEvent);

export default router;

