import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import http from 'node:http';
import app from '../src/app.js';
import { pool } from '../src/db.js';
import { generateToken } from '../src/utils/auth.js';
import { hashPairingCode, generatePairingCode } from '../src/utils/pairing.js';
import { resetAllRateLimits } from '../src/middleware/rateLimiter.js';

describe('Pairing & Devices API (/api/pairing & /api/devices)', () => {
  let server;
  let baseUrl;
  const TEST_SECRET = 'pairing_testing_secret_key_1234567890abcdef';

  const parentUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'parent@example.com',
    role: 'parent',
  };

  const studentUser = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'student@example.com',
    role: 'student',
  };

  let parentToken;
  let studentToken;

  before(async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    parentToken = generateToken(parentUser);
    studentToken = generateToken(studentUser);

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
    resetAllRateLimits();
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    mock.reset();
    resetAllRateLimits();
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

  describe('POST /api/pairing/code (Code Generation)', () => {
    it('rejects unauthenticated requests (401)', async () => {
      const res = await apiRequest('/pairing/code', { method: 'POST' });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.error, 'Unauthorized');
    });

    it('rejects non-parent role e.g. student (403 Forbidden)', async () => {
      const res = await apiRequest('/pairing/code', {
        method: 'POST',
        token: studentToken,
      });
      assert.strictEqual(res.status, 403);
      assert.strictEqual(res.data.error, 'Forbidden');
    });

    it('successfully generates pairing code for authenticated parent', async () => {
      let invalidatedPrevious = false;
      let insertedHash = null;

      mock.method(pool, 'query', async (queryText, params) => {
        if (queryText.includes('UPDATE pairing_codes')) {
          invalidatedPrevious = true;
          assert.strictEqual(params[0], parentUser.id);
          return { rowCount: 1 };
        }
        if (queryText.includes('INSERT INTO pairing_codes')) {
          assert.strictEqual(params[0], parentUser.id);
          insertedHash = params[1];
          // Ensure SHA-256 hash length is 64 hex characters
          assert.strictEqual(insertedHash.length, 64);
          return {
            rows: [
              {
                id: 'code-uuid-1',
                expires_at: new Date(Date.now() + 600000).toISOString(),
                created_at: new Date().toISOString(),
              },
            ],
          };
        }
        throw new Error(`Unexpected query: ${queryText}`);
      });

      const res = await apiRequest('/pairing/code', {
        method: 'POST',
        token: parentToken,
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(invalidatedPrevious, true);
      assert.strictEqual(typeof res.data.code, 'string');
      // Format should be 3 blocks of 4 chars
      assert.match(res.data.code, /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      assert.strictEqual(res.data.expiresInSeconds, 600);
      // Plaintext code must match the inserted hash
      assert.strictEqual(hashPairingCode(res.data.code), insertedHash);
      // Raw hash must NOT be in the API response
      assert.strictEqual(res.data.code_hash, undefined);
    });
  });

  describe('GET /api/pairing/code (Active Code Status)', () => {
    it('returns active: true when an unexpired code exists for parent', async () => {
      const expiresAt = new Date(Date.now() + 300000).toISOString();

      mock.method(pool, 'query', async (queryText, params) => {
        if (queryText.includes('FROM pairing_codes')) {
          assert.strictEqual(params[0], parentUser.id);
          return {
            rows: [
              {
                id: 'code-uuid-active',
                expires_at: expiresAt,
                created_at: new Date().toISOString(),
              },
            ],
          };
        }
        throw new Error(`Unexpected query: ${queryText}`);
      });

      const res = await apiRequest('/pairing/code', {
        method: 'GET',
        token: parentToken,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.active, true);
      assert.strictEqual(res.data.expiresAt, expiresAt);
      assert.strictEqual(typeof res.data.remainingSeconds, 'number');
      assert.strictEqual(res.data.remainingSeconds > 0, true);
    });

    it('returns active: false when no unexpired code exists', async () => {
      mock.method(pool, 'query', async () => {
        return { rows: [] };
      });

      const res = await apiRequest('/pairing/code', {
        method: 'GET',
        token: parentToken,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.active, false);
    });
  });

  describe('POST /api/pairing/redeem (Code Redemption)', () => {
    it('rejects unauthenticated requests (401)', async () => {
      const res = await apiRequest('/pairing/redeem', {
        method: 'POST',
        body: { code: 'TEST-CODE' },
      });
      assert.strictEqual(res.status, 401);
    });

    it('rejects non-student role e.g. parent (403 Forbidden)', async () => {
      const res = await apiRequest('/pairing/redeem', {
        method: 'POST',
        token: parentToken,
        body: { code: 'TEST-CODE' },
      });
      assert.strictEqual(res.status, 403);
    });

    it('rejects empty or invalid code format (400)', async () => {
      const res = await apiRequest('/pairing/redeem', {
        method: 'POST',
        token: studentToken,
        body: { code: '123' },
      });
      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /invalid pairing code/i);
    });

    it('rejects unknown / non-existent pairing code (400)', async () => {
      const mockClient = {
        query: async (text) => {
          if (text === 'BEGIN;' || text === 'ROLLBACK;') return;
          if (text.includes('FROM pairing_codes')) {
            return { rows: [] }; // Not found
          }
          throw new Error(`Unexpected client query: ${text}`);
        },
        release: () => {},
      };

      mock.method(pool, 'connect', async () => mockClient);

      const res = await apiRequest('/pairing/redeem', {
        method: 'POST',
        token: studentToken,
        body: { code: 'INVALID-CODE-9999' },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /unrecognized/i);
    });

    it('rejects already-used pairing code (400)', async () => {
      const mockClient = {
        query: async (text) => {
          if (text === 'BEGIN;' || text === 'ROLLBACK;') return;
          if (text.includes('FROM pairing_codes')) {
            return {
              rows: [
                {
                  id: 'c1',
                  parent_id: parentUser.id,
                  used: true, // Already redeemed
                  attempt_count: 0,
                  expires_at: new Date(Date.now() + 600000).toISOString(),
                },
              ],
            };
          }
          throw new Error(`Unexpected client query: ${text}`);
        },
        release: () => {},
      };

      mock.method(pool, 'connect', async () => mockClient);

      const res = await apiRequest('/pairing/redeem', {
        method: 'POST',
        token: studentToken,
        body: { code: 'ALREADY-USED-CODE' },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /already been redeemed/i);
    });

    it('rejects expired pairing code (400)', async () => {
      const mockClient = {
        query: async (text) => {
          if (text === 'BEGIN;' || text === 'ROLLBACK;') return;
          if (text.includes('FROM pairing_codes')) {
            return {
              rows: [
                {
                  id: 'c1',
                  parent_id: parentUser.id,
                  used: false,
                  attempt_count: 0,
                  expires_at: new Date(Date.now() - 60000).toISOString(), // Expired 1m ago
                },
              ],
            };
          }
          throw new Error(`Unexpected client query: ${text}`);
        },
        release: () => {},
      };

      mock.method(pool, 'connect', async () => mockClient);

      const res = await apiRequest('/pairing/redeem', {
        method: 'POST',
        token: studentToken,
        body: { code: 'EXPIRED-CODE-1234' },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /expired/i);
    });

    it('rejects locked pairing code when attempt_count >= 5 (400)', async () => {
      const mockClient = {
        query: async (text) => {
          if (text === 'BEGIN;' || text === 'ROLLBACK;') return;
          if (text.includes('FROM pairing_codes')) {
            return {
              rows: [
                {
                  id: 'c1',
                  parent_id: parentUser.id,
                  used: false,
                  attempt_count: 5, // Locked code
                  expires_at: new Date(Date.now() + 600000).toISOString(),
                },
              ],
            };
          }
          throw new Error(`Unexpected client query: ${text}`);
        },
        release: () => {},
      };

      mock.method(pool, 'connect', async () => mockClient);

      const res = await apiRequest('/pairing/redeem', {
        method: 'POST',
        token: studentToken,
        body: { code: 'LOCKED-CODE-1234' },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /locked due to too many failed attempts/i);
    });

    it('rejects student already linked to a different parent (409 Conflict)', async () => {
      const mockClient = {
        query: async (text) => {
          if (text === 'BEGIN;' || text === 'ROLLBACK;') return;
          if (text.includes('FROM pairing_codes')) {
            return {
              rows: [
                {
                  id: 'c1',
                  parent_id: parentUser.id,
                  used: false,
                  attempt_count: 0,
                  expires_at: new Date(Date.now() + 600000).toISOString(),
                },
              ],
            };
          }
          if (text.includes('FROM student_profiles')) {
            return {
              rows: [
                {
                  id: 'existing-sp-1',
                  user_id: studentUser.id,
                  parent_id: '99999999-9999-9999-9999-999999999999', // Different parent!
                },
              ],
            };
          }
          throw new Error(`Unexpected client query: ${text}`);
        },
        release: () => {},
      };

      mock.method(pool, 'connect', async () => mockClient);

      const res = await apiRequest('/pairing/redeem', {
        method: 'POST',
        token: studentToken,
        body: { code: 'VALID-CODE-1234' },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.error, 'Conflict');
      assert.match(res.data.message, /different parent/i);
    });

    it('successfully redeems valid code and associates student + device (200 OK)', async () => {
      const rawCode = generatePairingCode();
      let codeMarkedUsed = false;
      let deviceCreated = false;

      const mockClient = {
        query: async (text, params) => {
          if (text === 'BEGIN;' || text === 'COMMIT;') return;
          if (text.includes('FROM pairing_codes') && text.includes('code_hash')) {
            assert.strictEqual(params[0], hashPairingCode(rawCode));
            return {
              rows: [
                {
                  id: 'code-row-1',
                  parent_id: parentUser.id,
                  used: false,
                  attempt_count: 0,
                  expires_at: new Date(Date.now() + 600000).toISOString(),
                },
              ],
            };
          }
          if (text.includes('student_profiles') && text.includes('user_id = $1')) {
            assert.strictEqual(params[0], studentUser.id);
            return { rows: [] }; // No existing profile
          }
          if (text.includes('FROM users') && text.includes('id = $1')) {
            assert.strictEqual(params[0], studentUser.id);
            return { rows: [{ display_name: 'Alex Student' }] };
          }
          if (text.includes('INSERT INTO student_profiles')) {
            assert.strictEqual(params[0], studentUser.id);
            assert.strictEqual(params[1], parentUser.id);
            assert.strictEqual(params[2], 'AS'); // Initials
            return { rows: [{ id: 'new-profile-uuid', initials: 'AS' }] };
          }
          if (text.includes('INSERT INTO devices')) {
            deviceCreated = true;
            assert.strictEqual(params[0], parentUser.id);
            assert.strictEqual(params[1], 'new-profile-uuid');
            assert.strictEqual(params[2], "Alex's Chromebook");
            assert.strictEqual(params[3], 'laptop');
            return {
              rows: [
                {
                  id: 'device-uuid-1',
                  name: "Alex's Chromebook",
                  device_type: 'laptop',
                  device_code: 'DEV-A1B2C3D4',
                  status: 'offline', // Honest offline status
                },
              ],
            };
          }
          if (text.includes('UPDATE pairing_codes') && text.includes('used = TRUE')) {
            codeMarkedUsed = true;
            assert.strictEqual(params[0], 'code-row-1');
            return { rowCount: 1 };
          }
          throw new Error(`Unexpected client query: ${text}`);
        },
        release: () => {},
      };

      mock.method(pool, 'connect', async () => mockClient);
      mock.method(pool, 'query', async (text) => {
        if (text.includes('users') && text.includes('display_name')) {
          return { rows: [{ display_name: 'Parent User', email: 'parent@example.com' }] };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest('/pairing/redeem', {
        method: 'POST',
        token: studentToken,
        body: {
          code: rawCode,
          deviceName: "Alex's Chromebook",
          deviceType: 'laptop',
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(codeMarkedUsed, true);
      assert.strictEqual(deviceCreated, true);
      assert.strictEqual(res.data.parent.displayName, 'Parent User');
      assert.strictEqual(res.data.device.name, "Alex's Chromebook");
      assert.strictEqual(res.data.device.status, 'offline');
    });

    it('throttles with 429 Too Many Requests after repeated failed attempts', async () => {
      const mockClient = {
        query: async (text) => {
          if (text === 'BEGIN;' || text === 'ROLLBACK;') return;
          if (text.includes('FROM pairing_codes')) {
            return { rows: [] }; // Code not found
          }
          throw new Error(`Unexpected client query: ${text}`);
        },
        release: () => {},
      };
      mock.method(pool, 'connect', async () => mockClient);

      // Send 5 invalid requests
      for (let i = 0; i < 5; i++) {
        const failRes = await apiRequest('/pairing/redeem', {
          method: 'POST',
          token: studentToken,
          body: { code: 'INVALID-CODE-XYZ' },
        });
        assert.strictEqual(failRes.status, 400);
      }

      // The 6th attempt should be blocked with 429 Too Many Requests
      const throttledRes = await apiRequest('/pairing/redeem', {
        method: 'POST',
        token: studentToken,
        body: { code: 'INVALID-CODE-XYZ' },
      });

      assert.strictEqual(throttledRes.status, 429);
      assert.strictEqual(throttledRes.data.error, 'Too Many Requests');
      assert.match(throttledRes.data.message, /too many failed pairing attempts/i);
      assert.strictEqual(typeof throttledRes.data.retryAfterSeconds, 'number');
    });

    it('allows already-paired student to pair an additional device under the same parent', async () => {
      const rawCode = generatePairingCode();
      let codeMarkedUsed = false;
      let deviceCreated = false;

      const mockClient = {
        query: async (text, params) => {
          if (text === 'BEGIN;' || text === 'COMMIT;') return;
          if (text.includes('FROM pairing_codes') && text.includes('code_hash')) {
            return {
              rows: [
                {
                  id: 'code-row-second',
                  parent_id: parentUser.id, // SAME parent
                  used: false,
                  attempt_count: 0,
                  expires_at: new Date(Date.now() + 600000).toISOString(),
                },
              ],
            };
          }
          if (text.includes('student_profiles') && text.includes('user_id = $1')) {
            // Already has profile linked to SAME parent!
            return {
              rows: [
                {
                  id: 'existing-sp-uuid',
                  parent_id: parentUser.id,
                  initials: 'AS',
                },
              ],
            };
          }
          if (text.includes('INSERT INTO devices')) {
            deviceCreated = true;
            assert.strictEqual(params[0], parentUser.id);
            assert.strictEqual(params[1], 'existing-sp-uuid');
            assert.strictEqual(params[2], "Alex's Tablet");
            return {
              rows: [
                {
                  id: 'device-uuid-2',
                  name: "Alex's Tablet",
                  device_type: 'tablet',
                  device_code: 'DEV-TAB-1234',
                  status: 'offline',
                },
              ],
            };
          }
          if (text.includes('UPDATE pairing_codes') && text.includes('used = TRUE')) {
            codeMarkedUsed = true;
            return { rowCount: 1 };
          }
          throw new Error(`Unexpected client query: ${text}`);
        },
        release: () => {},
      };

      mock.method(pool, 'connect', async () => mockClient);
      mock.method(pool, 'query', async (text) => {
        if (text.includes('users') && text.includes('display_name')) {
          return { rows: [{ display_name: 'Parent User', email: 'parent@example.com' }] };
        }
        throw new Error(`Unexpected pool query: ${text}`);
      });

      const res = await apiRequest('/pairing/redeem', {
        method: 'POST',
        token: studentToken,
        body: {
          code: rawCode,
          deviceName: "Alex's Tablet",
          deviceType: 'tablet',
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(codeMarkedUsed, true);
      assert.strictEqual(deviceCreated, true);
      assert.strictEqual(res.data.device.name, "Alex's Tablet");
      assert.strictEqual(res.data.device.deviceType, 'tablet');
    });
  });

  describe('GET /api/pairing/student-status', () => {
    it('returns isPaired: false when student has no linked profile', async () => {
      mock.method(pool, 'query', async () => ({ rows: [] }));

      const res = await apiRequest('/pairing/student-status', {
        method: 'GET',
        token: studentToken,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.isPaired, false);
    });

    it('returns isPaired: true with parent details when paired', async () => {
      mock.method(pool, 'query', async () => ({
        rows: [
          {
            profile_id: 'sp-1',
            parent_id: parentUser.id,
            initials: 'AS',
            grade: 'Grade 8',
            school: 'Lincoln Middle',
            parent_name: 'Parent User',
            parent_email: 'parent@example.com',
            device_id: 'dev-1',
            device_name: "Alex's Laptop",
            device_type: 'laptop',
            device_code: 'DEV-1234',
            device_status: 'offline',
          },
        ],
      }));

      const res = await apiRequest('/pairing/student-status', {
        method: 'GET',
        token: studentToken,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.isPaired, true);
      assert.strictEqual(res.data.parent.displayName, 'Parent User');
      assert.strictEqual(res.data.device.name, "Alex's Laptop");
    });
  });

  describe('GET /api/devices (Parent Devices List & Ownership)', () => {
    it('rejects unauthenticated requests (401)', async () => {
      const res = await apiRequest('/devices');
      assert.strictEqual(res.status, 401);
    });

    it('rejects non-parent role (403)', async () => {
      const res = await apiRequest('/devices', { token: studentToken });
      assert.strictEqual(res.status, 403);
    });

    it('returns only devices belonging to the authenticated parent', async () => {
      mock.method(pool, 'query', async (text, params) => {
        if (text.includes('WHERE d.parent_id = $1')) {
          assert.strictEqual(params[0], parentUser.id);
          return {
            rows: [
              {
                id: 'd-1',
                parentId: parentUser.id,
                studentId: 'sp-1',
                name: "Liam's Laptop",
                deviceType: 'laptop',
                status: 'offline',
                deviceCode: 'DEV-LL-1001',
                studentName: 'Liam Jenkins',
                studentEmail: 'liam@example.com',
                studentInitials: 'LJ',
              },
            ],
          };
        }
        throw new Error(`Unexpected query: ${text}`);
      });

      const res = await apiRequest('/devices', { token: parentToken });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.totalCount, 1);
      assert.strictEqual(res.data.devices[0].name, "Liam's Laptop");
      assert.strictEqual(res.data.devices[0].parentId, parentUser.id);
      assert.strictEqual(res.data.devices[0].studentName, 'Liam Jenkins');
    });
  });

  describe('DELETE /api/devices/:id (Parent Device Decommission)', () => {
    const validDeviceId = '33333333-3333-3333-3333-333333333333';

    it('rejects unauthenticated requests (401)', async () => {
      const res = await apiRequest(`/devices/${validDeviceId}`, { method: 'DELETE' });
      assert.strictEqual(res.status, 401);
    });

    it('rejects non-parent role e.g. student (403 Forbidden)', async () => {
      const res = await apiRequest(`/devices/${validDeviceId}`, {
        method: 'DELETE',
        token: studentToken,
      });
      assert.strictEqual(res.status, 403);
    });

    it('rejects invalid non-UUID device ID (400 Bad Request)', async () => {
      const res = await apiRequest('/devices/invalid-not-a-uuid', {
        method: 'DELETE',
        token: parentToken,
      });
      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /invalid device id format/i);
    });

    it('returns 404 Not Found when device does not exist', async () => {
      mock.method(pool, 'query', async () => ({ rows: [] }));

      const res = await apiRequest(`/devices/${validDeviceId}`, {
        method: 'DELETE',
        token: parentToken,
      });
      assert.strictEqual(res.status, 404);
      assert.match(res.data.message, /not found/i);
    });

    it('rejects deactivation of device owned by a different parent (403 Forbidden)', async () => {
      mock.method(pool, 'query', async (text) => {
        if (text.includes('SELECT') && text.includes('FROM devices')) {
          return {
            rows: [
              {
                id: validDeviceId,
                parent_id: '99999999-9999-9999-9999-999999999999', // Different parent!
                name: "Another Child's Laptop",
                device_code: 'DEV-OTHER-99',
              },
            ],
          };
        }
        throw new Error(`Unexpected query: ${text}`);
      });

      const res = await apiRequest(`/devices/${validDeviceId}`, {
        method: 'DELETE',
        token: parentToken,
      });
      assert.strictEqual(res.status, 403);
      assert.match(res.data.message, /do not own this device/i);
    });

    it('successfully decommissions device owned by parent (200 OK)', async () => {
      let deleteQueryExecuted = false;

      mock.method(pool, 'query', async (text, params) => {
        if (text.includes('SELECT') && text.includes('FROM devices')) {
          assert.strictEqual(params[0], validDeviceId);
          return {
            rows: [
              {
                id: validDeviceId,
                parent_id: parentUser.id,
                name: "Liam's Old Laptop",
                device_code: 'DEV-OLD-1234',
              },
            ],
          };
        }
        if (text.includes('DELETE FROM devices')) {
          deleteQueryExecuted = true;
          assert.strictEqual(params[0], validDeviceId);
          assert.strictEqual(params[1], parentUser.id);
          return { rowCount: 1 };
        }
        throw new Error(`Unexpected query: ${text}`);
      });

      const res = await apiRequest(`/devices/${validDeviceId}`, {
        method: 'DELETE',
        token: parentToken,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(deleteQueryExecuted, true);
      assert.match(res.data.message, /decommissioned successfully/i);
      assert.strictEqual(res.data.device.id, validDeviceId);
      assert.strictEqual(res.data.device.name, "Liam's Old Laptop");
      assert.strictEqual(res.data.device.deviceCode, 'DEV-OLD-1234');
    });
  });
});
