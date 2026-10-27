import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import http from 'node:http';
import app from '../src/app.js';
import { pool } from '../src/db.js';
import { generateToken } from '../src/utils/auth.js';

describe('Activity Event API (POST /api/sessions/:id/events)', () => {
  let server;
  let baseUrl;
  const TEST_SECRET = 'events_testing_secret_key_1234567890abcdef';

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

  const VALID_SESSION_ID  = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const STUDENT_PROFILE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const LOG_ID            = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  let studentToken;
  let parentToken;

  before(async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    studentToken = generateToken(studentUser);
    parentToken  = generateToken(parentUser);

    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}/api`;
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

  async function postEvent(sessionId, body, { token } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}/sessions/${sessionId}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, data };
  }

  // ── Auth / role guards ────────────────────────────────────────────────────

  it('rejects unauthenticated request with 401', async () => {
    const res = await postEvent(VALID_SESSION_ID, { event: 'focus_start' });
    assert.strictEqual(res.status, 401);
  });

  it('rejects parent role with 403', async () => {
    const res = await postEvent(VALID_SESSION_ID, { event: 'focus_start' }, { token: parentToken });
    assert.strictEqual(res.status, 403);
  });

  // ── Input validation ──────────────────────────────────────────────────────

  it('rejects a non-UUID session ID with 400', async () => {
    const res = await postEvent('not-a-uuid', { event: 'focus_start' }, { token: studentToken });
    assert.strictEqual(res.status, 400);
    assert.match(res.data.message, /invalid session id/i);
  });

  it('rejects missing event field with 400', async () => {
    const res = await postEvent(VALID_SESSION_ID, {}, { token: studentToken });
    assert.strictEqual(res.status, 400);
    assert.match(res.data.message, /event is required/i);
  });

  it('rejects blank (whitespace-only) event with 400', async () => {
    const res = await postEvent(VALID_SESSION_ID, { event: '   ' }, { token: studentToken });
    assert.strictEqual(res.status, 400);
    assert.match(res.data.message, /event is required/i);
  });

  // ── Profile / session lookups ─────────────────────────────────────────────

  it('returns 404 when student has no student_profile', async () => {
    mock.method(pool, 'query', async (text) => {
      if (text.includes('FROM student_profiles')) return { rows: [] };
      throw new Error(`Unexpected query: ${text}`);
    });

    const res = await postEvent(VALID_SESSION_ID, { event: 'focus_start' }, { token: studentToken });
    assert.strictEqual(res.status, 404);
    assert.match(res.data.message, /student profile not found/i);
  });

  it('returns 404 when session does not belong to this student', async () => {
    mock.method(pool, 'query', async (text) => {
      if (text.includes('FROM student_profiles')) return { rows: [{ id: STUDENT_PROFILE_ID }] };
      if (text.includes('FROM study_sessions'))   return { rows: [] }; // not owned
      throw new Error(`Unexpected query: ${text}`);
    });

    const res = await postEvent(VALID_SESSION_ID, { event: 'focus_start' }, { token: studentToken });
    assert.strictEqual(res.status, 404);
    assert.match(res.data.message, /study session not found or does not belong/i);
  });

  // ── Success ───────────────────────────────────────────────────────────────

  it('returns 201 and the new log entry on success', async () => {
    const NOW = new Date().toISOString();

    mock.method(pool, 'query', async (text) => {
      if (text.includes('FROM student_profiles')) {
        return { rows: [{ id: STUDENT_PROFILE_ID }] };
      }
      if (text.includes('FROM study_sessions')) {
        return { rows: [{ id: VALID_SESSION_ID }] };
      }
      if (text.includes('INSERT INTO session_logs')) {
        return {
          rows: [{
            id: LOG_ID,
            sessionId: VALID_SESSION_ID,
            loggedAt: NOW,
            event: 'focus_start',
          }],
        };
      }
      throw new Error(`Unexpected query: ${text}`);
    });

    const res = await postEvent(VALID_SESSION_ID, { event: 'focus_start' }, { token: studentToken });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.message, 'Activity event recorded.');
    assert.strictEqual(res.data.log.id, LOG_ID);
    assert.strictEqual(res.data.log.sessionId, VALID_SESSION_ID);
    assert.strictEqual(res.data.log.event, 'focus_start');
    assert.ok(res.data.log.loggedAt, 'loggedAt should be present');
  });

  it('trims and truncates the event string to 500 chars', async () => {
    const longEvent = 'x'.repeat(600);
    let capturedEvent = null;

    mock.method(pool, 'query', async (text, params) => {
      if (text.includes('FROM student_profiles')) return { rows: [{ id: STUDENT_PROFILE_ID }] };
      if (text.includes('FROM study_sessions'))   return { rows: [{ id: VALID_SESSION_ID }] };
      if (text.includes('INSERT INTO session_logs')) {
        capturedEvent = params[1]; // second param is the event value
        return { rows: [{ id: LOG_ID, sessionId: VALID_SESSION_ID, loggedAt: new Date().toISOString(), event: capturedEvent }] };
      }
      throw new Error(`Unexpected query: ${text}`);
    });

    const res = await postEvent(VALID_SESSION_ID, { event: `  ${longEvent}  ` }, { token: studentToken });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(capturedEvent.length, 500, 'event should be truncated to 500 chars');
  });
});
