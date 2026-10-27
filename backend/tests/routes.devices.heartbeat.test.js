import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import http from 'node:http';
import app from '../src/app.js';
import { pool } from '../src/db.js';
import { generateToken } from '../src/utils/auth.js';

describe('Device Heartbeat API (POST /api/devices/:id/heartbeat)', () => {
  let server;
  let baseUrl;
  const TEST_SECRET = 'heartbeat_testing_secret_key_1234567890abcdef';

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

  const VALID_DEVICE_ID   = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const STUDENT_PROFILE_ID = 'pppppppp-pppp-pppp-pppp-pppppppppppp';

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

  async function post(path, { token } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${path}`, { method: 'POST', headers });
    const data = await res.json();
    return { status: res.status, data };
  }

  // ── Auth / role guards ────────────────────────────────────────────────────

  it('rejects unauthenticated requests with 401', async () => {
    const res = await post(`/devices/${VALID_DEVICE_ID}/heartbeat`);
    assert.strictEqual(res.status, 401);
  });

  it('rejects parent role with 403', async () => {
    const res = await post(`/devices/${VALID_DEVICE_ID}/heartbeat`, { token: parentToken });
    assert.strictEqual(res.status, 403);
  });

  it('rejects a malformed (non-UUID) device ID with 400', async () => {
    const res = await post('/devices/not-a-uuid/heartbeat', { token: studentToken });
    assert.strictEqual(res.status, 400);
    assert.match(res.data.message, /invalid device id/i);
  });

  // ── Profile lookup ────────────────────────────────────────────────────────

  it('returns 404 when the student has no student_profile', async () => {
    mock.method(pool, 'query', async (text) => {
      if (text.includes('FROM student_profiles')) return { rows: [] };
      throw new Error(`Unexpected query: ${text}`);
    });

    const res = await post(`/devices/${VALID_DEVICE_ID}/heartbeat`, { token: studentToken });
    assert.strictEqual(res.status, 404);
    assert.match(res.data.message, /student profile not found/i);
  });

  // ── Ownership check ───────────────────────────────────────────────────────

  it('returns 404 when device does not belong to this student', async () => {
    mock.method(pool, 'query', async (text) => {
      if (text.includes('FROM student_profiles')) {
        return { rows: [{ id: STUDENT_PROFILE_ID }] };
      }
      if (text.includes('UPDATE devices')) {
        // Simulate zero rows — device not found or wrong owner
        return { rows: [] };
      }
      throw new Error(`Unexpected query: ${text}`);
    });

    const res = await post(`/devices/${VALID_DEVICE_ID}/heartbeat`, { token: studentToken });
    assert.strictEqual(res.status, 404);
    assert.match(res.data.message, /device not found or does not belong/i);
  });

  // ── Success ───────────────────────────────────────────────────────────────

  it('returns 200 and updates last_seen_at + status for owned device', async () => {
    const NOW = new Date().toISOString();

    mock.method(pool, 'query', async (text) => {
      if (text.includes('FROM student_profiles')) {
        return { rows: [{ id: STUDENT_PROFILE_ID }] };
      }
      if (text.includes('UPDATE devices')) {
        return {
          rows: [{
            id: VALID_DEVICE_ID,
            name: 'Student Laptop',
            status: 'online',
            lastSeenAt: NOW,
            updatedAt: NOW,
          }],
        };
      }
      throw new Error(`Unexpected query: ${text}`);
    });

    const res = await post(`/devices/${VALID_DEVICE_ID}/heartbeat`, { token: studentToken });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.message, 'Heartbeat recorded.');
    assert.strictEqual(res.data.device.id, VALID_DEVICE_ID);
    assert.strictEqual(res.data.device.status, 'online');
    assert.ok(res.data.device.lastSeenAt, 'lastSeenAt should be present');
  });
});
