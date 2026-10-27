import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import http from 'node:http';
import app from '../src/app.js';
import { pool } from '../src/db.js';
import { generateToken } from '../src/utils/auth.js';

describe('Study Sessions API (/api/sessions)', () => {
  let server;
  let baseUrl;
  const TEST_SECRET = 'sessions_testing_secret_key_1234567890abcdef';

  const studentUser = {
    id: '11111111-2222-3333-4444-555555555555',
    email: 'student@example.com',
    role: 'student',
  };

  const parentUser = {
    id: '99999999-8888-7777-6666-555555555555',
    email: 'parent@example.com',
    role: 'parent',
  };

  let studentToken;
  let parentToken;

  before(async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    studentToken = generateToken(studentUser);
    parentToken = generateToken(parentUser);

    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    mock.reset();
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    mock.reset();
  });

  async function apiRequest(path, { method = 'GET', body, token } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return { status: response.status, data };
  }

  describe('POST /api/sessions/start (Start Study Session)', () => {
    it('rejects unauthenticated requests (401)', async () => {
      const res = await apiRequest('/sessions/start', {
        method: 'POST',
        body: { subject: 'Mathematics' },
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.error, 'Unauthorized');
    });

    it('rejects non-student role e.g. parent (403 Forbidden)', async () => {
      const res = await apiRequest('/sessions/start', {
        method: 'POST',
        token: parentToken,
        body: { subject: 'Mathematics' },
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.error, 'Forbidden');
    });

    it('returns 404 when student has no enrolled student_profile', async () => {
      mock.method(pool, 'query', async (text, params) => {
        if (text.includes('FROM student_profiles') && text.includes('user_id = $1')) {
          assert.strictEqual(params[0], studentUser.id);
          return { rows: [] };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest('/sessions/start', {
        method: 'POST',
        token: studentToken,
        body: { subject: 'Mathematics' },
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.error, 'Not Found');
      assert.match(res.data.message, /student profile not found/i);
    });

    it('successfully starts a session deriving student identity from authenticated token (201 Created)', async () => {
      const studentProfileId = 'sp-uuid-12345';
      const pairedDeviceId = 'dev-uuid-67890';
      let insertExecuted = false;

      mock.method(pool, 'query', async (text, params) => {
        if (text.includes('FROM student_profiles') && text.includes('user_id = $1')) {
          assert.strictEqual(params[0], studentUser.id);
          return { rows: [{ id: studentProfileId }] };
        }
        if (text.includes('FROM devices') && text.includes('student_id = $1')) {
          assert.strictEqual(params[0], studentProfileId);
          return { rows: [{ id: pairedDeviceId }] };
        }
        if (text.includes('INSERT INTO study_sessions')) {
          insertExecuted = true;
          // Ensure student_id is derived from profile, never client ID
          assert.strictEqual(params[0], studentProfileId);
          assert.strictEqual(params[1], pairedDeviceId);
          assert.strictEqual(params[2], 'Calculus Homework');
          assert.strictEqual(params[3], 'Mathematics');
          assert.strictEqual(params[4], 'Finish exercises 1 through 10');
          assert.strictEqual(params[5], 'Chapter 4 derivative rules');

          return {
            rows: [
              {
                id: 'sess-uuid-9999',
                studentId: studentProfileId,
                deviceId: pairedDeviceId,
                title: 'Calculus Homework',
                subject: 'Mathematics',
                status: 'active',
                startedAt: new Date().toISOString(),
                endedAt: null,
                durationSeconds: null,
                focusScore: null,
                goalText: 'Finish exercises 1 through 10',
                notes: 'Chapter 4 derivative rules',
                primaryApp: null,
                category: null,
                distractionCount: 0,
                isUserRecorded: true,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      // Pass client-supplied studentId to verify it is completely ignored
      const res = await apiRequest('/sessions/start', {
        method: 'POST',
        token: studentToken,
        body: {
          studentId: 'malicious-attacker-student-id',
          subject: 'Mathematics',
          title: 'Calculus Homework',
          goalText: 'Finish exercises 1 through 10',
          notes: 'Chapter 4 derivative rules',
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(insertExecuted, true);
      assert.strictEqual(res.data.session.id, 'sess-uuid-9999');
      assert.strictEqual(res.data.session.studentId, studentProfileId);
      assert.strictEqual(res.data.session.status, 'active');
      assert.strictEqual(res.data.session.title, 'Calculus Homework');
      assert.strictEqual(res.data.session.subject, 'Mathematics');
      assert.strictEqual(res.data.session.isUserRecorded, true);
    });

    it('works when mounting at root POST /api/sessions as well', async () => {
      const studentProfileId = 'sp-uuid-12345';

      mock.method(pool, 'query', async (text) => {
        if (text.includes('FROM student_profiles')) {
          return { rows: [{ id: studentProfileId }] };
        }
        if (text.includes('FROM devices')) {
          return { rows: [] };
        }
        if (text.includes('INSERT INTO study_sessions')) {
          return {
            rows: [
              {
                id: 'sess-uuid-root',
                studentId: studentProfileId,
                deviceId: null,
                title: 'Physics Focus Session',
                subject: 'Physics',
                status: 'active',
                startedAt: new Date().toISOString(),
                isUserRecorded: true,
              },
            ],
          };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest('/sessions', {
        method: 'POST',
        token: studentToken,
        body: {
          subject: 'Physics',
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.session.id, 'sess-uuid-root');
      assert.strictEqual(res.data.session.subject, 'Physics');
      assert.strictEqual(res.data.session.title, 'Physics Focus Session');
    });
  });

  describe('POST /api/sessions/:id/end (End Study Session)', () => {
    const validSessionId = '33333333-3333-3333-3333-333333333333';
    const studentProfileId = 'sp-uuid-12345';

    it('rejects unauthenticated requests (401)', async () => {
      const res = await apiRequest(`/sessions/${validSessionId}/end`, {
        method: 'POST',
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.error, 'Unauthorized');
    });

    it('rejects non-student roles e.g. parent (403 Forbidden)', async () => {
      const res = await apiRequest(`/sessions/${validSessionId}/end`, {
        method: 'POST',
        token: parentToken,
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.error, 'Forbidden');
    });

    it('rejects invalid non-UUID session IDs (400 Bad Request)', async () => {
      const res = await apiRequest('/sessions/invalid-not-a-uuid/end', {
        method: 'POST',
        token: studentToken,
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.error, 'Bad Request');
      assert.match(res.data.message, /valid UUID is required/i);
    });

    it('returns 404 when student has no profile in student_profiles', async () => {
      mock.method(pool, 'query', async (text) => {
        if (text.includes('FROM student_profiles')) {
          return { rows: [] };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest(`/sessions/${validSessionId}/end`, {
        method: 'POST',
        token: studentToken,
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.error, 'Not Found');
      assert.match(res.data.message, /student profile not found/i);
    });

    it('returns 404 when study session does not exist', async () => {
      mock.method(pool, 'query', async (text) => {
        if (text.includes('FROM student_profiles')) {
          return { rows: [{ id: studentProfileId }] };
        }
        if (text.includes('FROM study_sessions') && text.includes('WHERE id = $1')) {
          return { rows: [] };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest(`/sessions/${validSessionId}/end`, {
        method: 'POST',
        token: studentToken,
      });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.data.error, 'Not Found');
      assert.match(res.data.message, /study session not found/i);
    });

    it('rejects attempt to end another studentâ€™s session (403 Forbidden)', async () => {
      mock.method(pool, 'query', async (text) => {
        if (text.includes('FROM student_profiles')) {
          return { rows: [{ id: studentProfileId }] };
        }
        if (text.includes('FROM study_sessions') && text.includes('WHERE id = $1')) {
          return {
            rows: [
              {
                id: validSessionId,
                student_id: 'different-student-profile-uuid', // Different student!
                started_at: new Date(Date.now() - 3600000).toISOString(),
                ended_at: null,
                status: 'active',
              },
            ],
          };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest(`/sessions/${validSessionId}/end`, {
        method: 'POST',
        token: studentToken,
      });

      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.error, 'Forbidden');
      assert.match(res.data.message, /do not own this study session/i);
    });

    it('rejects attempt to end an already-ended session (400 Bad Request)', async () => {
      mock.method(pool, 'query', async (text) => {
        if (text.includes('FROM student_profiles')) {
          return { rows: [{ id: studentProfileId }] };
        }
        if (text.includes('FROM study_sessions') && text.includes('WHERE id = $1')) {
          return {
            rows: [
              {
                id: validSessionId,
                student_id: studentProfileId,
                started_at: new Date(Date.now() - 3600000).toISOString(),
                ended_at: new Date().toISOString(),
                status: 'completed', // Already completed
              },
            ],
          };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest(`/sessions/${validSessionId}/end`, {
        method: 'POST',
        token: studentToken,
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.error, 'Bad Request');
      assert.match(res.data.message, /already completed/i);
    });

    it('successfully ends an active session, computes duration, and returns 200 OK', async () => {
      const pastStart = new Date(Date.now() - 45 * 60 * 1000); // 45 minutes ago
      let updateExecuted = false;

      mock.method(pool, 'query', async (text, params) => {
        if (text.includes('FROM student_profiles')) {
          return { rows: [{ id: studentProfileId }] };
        }
        if (text.includes('FROM study_sessions') && text.includes('WHERE id = $1')) {
          return {
            rows: [
              {
                id: validSessionId,
                student_id: studentProfileId,
                started_at: pastStart.toISOString(),
                ended_at: null,
                status: 'active',
                notes: 'Initial study goal notes',
              },
            ],
          };
        }
        if (text.includes('UPDATE study_sessions')) {
          updateExecuted = true;
          // params: [endedAt, durationSeconds, validStatus, trimmedNotes, sessionId, studentProfileId]
          const durationSeconds = params[1];
          assert.strictEqual(typeof durationSeconds, 'number');
          assert.strictEqual(durationSeconds >= 2600 && durationSeconds <= 2800, true);
          assert.strictEqual(params[2], 'completed');
          assert.strictEqual(params[3], 'Finished all 10 problem sets');
          assert.strictEqual(params[4], validSessionId);
          assert.strictEqual(params[5], studentProfileId);

          return {
            rows: [
              {
                id: validSessionId,
                studentId: studentProfileId,
                deviceId: null,
                title: 'Mathematics Focus Session',
                subject: 'Mathematics',
                status: 'completed',
                startedAt: pastStart.toISOString(),
                endedAt: params[0].toISOString(),
                durationSeconds: durationSeconds,
                focusScore: null,
                goalText: null,
                notes: 'Finished all 10 problem sets',
                primaryApp: null,
                category: null,
                distractionCount: 0,
                isUserRecorded: true,
                createdAt: pastStart.toISOString(),
              },
            ],
          };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest(`/sessions/${validSessionId}/end`, {
        method: 'POST',
        token: studentToken,
        body: {
          notes: 'Finished all 10 problem sets',
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(updateExecuted, true);
      assert.strictEqual(res.data.session.id, validSessionId);
      assert.strictEqual(res.data.session.status, 'completed');
      assert.strictEqual(res.data.session.durationSeconds >= 2600, true);
      assert.strictEqual(res.data.session.notes, 'Finished all 10 problem sets');
    });

    it('works when invoked with PATCH /api/sessions/:id/end as well', async () => {
      mock.method(pool, 'query', async (text) => {
        if (text.includes('FROM student_profiles')) {
          return { rows: [{ id: studentProfileId }] };
        }
        if (text.includes('FROM study_sessions') && text.includes('WHERE id = $1')) {
          return {
            rows: [
              {
                id: validSessionId,
                student_id: studentProfileId,
                started_at: new Date(Date.now() - 60000).toISOString(),
                ended_at: null,
                status: 'active',
              },
            ],
          };
        }
        if (text.includes('UPDATE study_sessions')) {
          return {
            rows: [
              {
                id: validSessionId,
                studentId: studentProfileId,
                status: 'completed',
                durationSeconds: 60,
              },
            ],
          };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest(`/sessions/${validSessionId}/end`, {
        method: 'PATCH',
        token: studentToken,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.session.status, 'completed');
    });
  });

  // -----------------------------------------------------------------------------
  // GET /api/sessions — Fetch session history
  // -----------------------------------------------------------------------------
  describe('GET /api/sessions', () => {
    const studentProfileId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const session1Id = 'f1111111-1111-1111-1111-111111111111';
    const session2Id = 'f2222222-2222-2222-2222-222222222222';

    it('returns session list with pagination for authenticated student', async () => {
      mock.method(pool, 'query', async (text, params) => {
        if (text.includes('SELECT id FROM student_profiles')) {
          return { rows: [{ id: studentProfileId }] };
        }
        if (text.includes('FROM study_sessions') && text.includes('ORDER BY started_at DESC')) {
          return {
            rows: [
              { id: session1Id, studentId: studentProfileId, subject: 'Mathematics', status: 'completed', durationSeconds: 3600 },
              { id: session2Id, studentId: studentProfileId, subject: 'Science',     status: 'completed', durationSeconds: 1800 },
            ],
          };
        }
        if (text.includes('COUNT(*)')) {
          return { rows: [{ total: '2' }] };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest('/sessions', { token: studentToken });

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.sessions), 'sessions should be an array');
      assert.strictEqual(res.data.sessions.length, 2);
      assert.strictEqual(res.data.sessions[0].id, session1Id);
      assert.strictEqual(res.data.sessions[1].id, session2Id);
      assert.ok(res.data.pagination, 'pagination object should be present');
      assert.strictEqual(res.data.pagination.total, 2);
    });

    it('returns empty list when student has no sessions', async () => {
      mock.method(pool, 'query', async (text, params) => {
        if (text.includes('SELECT id FROM student_profiles')) {
          return { rows: [{ id: studentProfileId }] };
        }
        if (text.includes('FROM study_sessions') && text.includes('ORDER BY started_at DESC')) {
          return { rows: [] };
        }
        if (text.includes('COUNT(*)')) {
          return { rows: [{ total: '0' }] };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest('/sessions', { token: studentToken });

      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.data.sessions, []);
      assert.strictEqual(res.data.pagination.total, 0);
    });

    it('returns 404 when student profile does not exist', async () => {
      mock.method(pool, 'query', async (text, params) => {
        if (text.includes('SELECT id FROM student_profiles')) {
          return { rows: [] };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest('/sessions', { token: studentToken });

      assert.strictEqual(res.status, 404);
      assert.ok(res.data.message.includes('Student profile not found'));
    });

    it('rejects parent role with 403', async () => {
      const res = await apiRequest('/sessions', { token: parentToken });
      assert.strictEqual(res.status, 403);
    });

    it('rejects unauthenticated request with 401', async () => {
      const res = await apiRequest('/sessions');
      assert.strictEqual(res.status, 401);
    });
  });
});
