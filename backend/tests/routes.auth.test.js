import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import http from 'node:http';
import app from '../src/app.js';
import { pool } from '../src/db.js';
import { hashPassword, generateToken } from '../src/utils/auth.js';

describe('Auth API Routes (/api/auth)', () => {
  let server;
  let baseUrl;
  const TEST_SECRET = 'route_testing_secret_key_1234567890abcdef';

  before(async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    // Start an in-memory HTTP server on an ephemeral port
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api/auth`;
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

  // Helper function to send JSON requests
  async function apiRequest(endpoint, { method = 'POST', body, token } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return { status: response.status, data };
  }

  describe('POST /api/auth/register', () => {
    it('successfully registers a parent account with normalized email and safe response', async () => {
      const mockUser = {
        id: '10000000-0000-0000-0000-000000000001',
        email: 'parent@example.com',
        role: 'parent',
        display_name: 'Parent User',
        created_at: new Date().toISOString(),
      };

      // Mock pool.query:
      // 1st query: SELECT id FROM users WHERE email = $1 -> empty
      // 2nd query: INSERT INTO users ... RETURNING ... -> mockUser
      mock.method(pool, 'query', async (queryText, params) => {
        if (queryText.includes('SELECT id FROM users')) {
          assert.strictEqual(params[0], 'parent@example.com'); // Verifies normalized email
          return { rows: [] };
        }
        if (queryText.includes('INSERT INTO users')) {
          assert.strictEqual(params[0], 'parent@example.com');
          assert.strictEqual(params[2], 'parent');
          assert.strictEqual(params[3], 'Parent User');
          assert.notStrictEqual(params[1], 'SecretPassword123'); // Must NOT store plaintext password
          assert.match(params[1], /^\$2[aby]\$/); // Valid bcrypt hash
          return { rows: [mockUser] };
        }
        throw new Error(`Unexpected query: ${queryText}`);
      });

      const res = await apiRequest('/register', {
        body: {
          email: '  Parent@Example.COM  ',
          password: 'SecretPassword123',
          displayName: 'Parent User',
          role: 'parent',
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.data.message, 'User registered successfully');
      assert.strictEqual(res.data.user.id, mockUser.id);
      assert.strictEqual(res.data.user.email, 'parent@example.com');
      assert.strictEqual(res.data.user.role, 'parent');
      assert.strictEqual(res.data.user.displayName, 'Parent User');
      assert.strictEqual(res.data.user.password_hash, undefined); // NEVER expose password_hash
      assert.strictEqual(typeof res.data.token, 'string');
    });

    it('successfully registers a student account without unverified parent linking', async () => {
      const mockStudent = {
        id: '10000000-0000-0000-0000-000000000002',
        email: 'student@example.com',
        role: 'student',
        display_name: 'Student User',
        created_at: new Date().toISOString(),
      };

      let insertCalled = false;
      mock.method(pool, 'query', async (queryText, params) => {
        if (queryText.includes('SELECT id FROM users')) {
          return { rows: [] };
        }
        if (queryText.includes('INSERT INTO users')) {
          insertCalled = true;
          assert.strictEqual(params[2], 'student');
          return { rows: [mockStudent] };
        }
        throw new Error(`Unexpected query: ${queryText}`);
      });

      const res = await apiRequest('/register', {
        body: {
          email: 'student@example.com',
          password: 'StudentPassword123',
          display_name: 'Student User',
          role: 'student',
          // Malicious attempt to link arbitrary parent at registration
          parentId: '99999999-9999-9999-9999-999999999999',
        },
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(insertCalled, true);
      assert.strictEqual(res.data.user.role, 'student');
      assert.strictEqual(res.data.user.password_hash, undefined);
      assert.strictEqual(typeof res.data.token, 'string');
    });

    it('rejects registration with duplicate email (409 Conflict)', async () => {
      mock.method(pool, 'query', async (queryText) => {
        if (queryText.includes('SELECT id FROM users')) {
          return { rows: [{ id: 'existing-user-uuid' }] };
        }
        throw new Error(`Unexpected query: ${queryText}`);
      });

      const res = await apiRequest('/register', {
        body: {
          email: 'duplicate@example.com',
          password: 'ValidPassword123',
          displayName: 'Duplicate User',
          role: 'parent',
        },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.error, 'Conflict');
      assert.match(res.data.message, /already exists/);
    });

    it('handles race-condition unique constraint violation 23505 safely', async () => {
      mock.method(pool, 'query', async (queryText) => {
        if (queryText.includes('SELECT id FROM users')) {
          return { rows: [] };
        }
        if (queryText.includes('INSERT INTO users')) {
          const err = new Error('duplicate key value violates unique constraint');
          err.code = '23505';
          throw err;
        }
        throw new Error(`Unexpected query: ${queryText}`);
      });

      const res = await apiRequest('/register', {
        body: {
          email: 'race@example.com',
          password: 'ValidPassword123',
          displayName: 'Race User',
          role: 'parent',
        },
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.data.error, 'Conflict');
    });

    it('rejects registration with invalid email format', async () => {
      const res = await apiRequest('/register', {
        body: {
          email: 'not-an-email',
          password: 'ValidPassword123',
          displayName: 'Test User',
          role: 'parent',
        },
      });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.data.error, 'Bad Request');
      assert.match(res.data.message, /valid email/i);
    });

    it('rejects registration with password shorter than 8 characters', async () => {
      const res = await apiRequest('/register', {
        body: {
          email: 'user@example.com',
          password: 'Pass1',
          displayName: 'Test User',
          role: 'parent',
        },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /at least 8 characters/);
    });

    it('rejects registration with password missing numbers', async () => {
      const res = await apiRequest('/register', {
        body: {
          email: 'user@example.com',
          password: 'NoNumbersHere',
          displayName: 'Test User',
          role: 'parent',
        },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /at least one letter and one number/);
    });

    it('rejects registration with missing or empty display name', async () => {
      const res = await apiRequest('/register', {
        body: {
          email: 'user@example.com',
          password: 'ValidPassword123',
          displayName: '   ',
          role: 'parent',
        },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /display name is required/i);
    });

    it('rejects registration with invalid role', async () => {
      const res = await apiRequest('/register', {
        body: {
          email: 'user@example.com',
          password: 'ValidPassword123',
          displayName: 'Test User',
          role: 'administrator',
        },
      });

      assert.strictEqual(res.status, 400);
      assert.match(res.data.message, /parent.*student/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('successfully logs in with valid credentials and returns safe user + token', async () => {
      const plaintext = 'CorrectPassword123';
      const storedHash = await hashPassword(plaintext);

      mock.method(pool, 'query', async (queryText, params) => {
        if (queryText.includes('FROM users')) {
          assert.strictEqual(params[0], 'user@example.com');
          return {
            rows: [
              {
                id: '10000000-0000-0000-0000-000000000010',
                email: 'user@example.com',
                password_hash: storedHash,
                role: 'parent',
                display_name: 'Alice Parent',
                deleted_at: null,
              },
            ],
          };
        }
        throw new Error(`Unexpected query: ${queryText}`);
      });

      const res = await apiRequest('/login', {
        body: {
          email: '  User@Example.COM  ',
          password: plaintext,
        },
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.message, 'Login successful');
      assert.strictEqual(res.data.user.id, '10000000-0000-0000-0000-000000000010');
      assert.strictEqual(res.data.user.email, 'user@example.com');
      assert.strictEqual(res.data.user.role, 'parent');
      assert.strictEqual(res.data.user.displayName, 'Alice Parent');
      assert.strictEqual(res.data.user.password_hash, undefined);
      assert.strictEqual(typeof res.data.token, 'string');
    });

    it('rejects login with incorrect password using a generic error message', async () => {
      const storedHash = await hashPassword('CorrectPassword123');

      mock.method(pool, 'query', async (queryText) => {
        if (queryText.includes('FROM users')) {
          return {
            rows: [
              {
                id: 'user-id',
                email: 'user@example.com',
                password_hash: storedHash,
                role: 'parent',
                display_name: 'Alice',
                deleted_at: null,
              },
            ],
          };
        }
        throw new Error(`Unexpected query: ${queryText}`);
      });

      const res = await apiRequest('/login', {
        body: {
          email: 'user@example.com',
          password: 'WrongPassword123',
        },
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.error, 'Unauthorized');
      assert.strictEqual(res.data.message, 'Invalid email or password.');
    });

    it('rejects login for non-existent email with generic error message', async () => {
      mock.method(pool, 'query', async (queryText) => {
        if (queryText.includes('FROM users')) {
          return { rows: [] };
        }
        throw new Error(`Unexpected query: ${queryText}`);
      });

      const res = await apiRequest('/login', {
        body: {
          email: 'nonexistent@example.com',
          password: 'Password123',
        },
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.error, 'Unauthorized');
      assert.strictEqual(res.data.message, 'Invalid email or password.');
    });

    it('rejects login for soft-deleted user with generic error message', async () => {
      mock.method(pool, 'query', async (queryText) => {
        if (queryText.includes('FROM users')) {
          return {
            rows: [
              {
                id: 'deleted-user-id',
                email: 'deleted@example.com',
                password_hash: 'any-hash',
                role: 'parent',
                display_name: 'Deleted',
                deleted_at: new Date().toISOString(), // Soft-deleted
              },
            ],
          };
        }
        throw new Error(`Unexpected query: ${queryText}`);
      });

      const res = await apiRequest('/login', {
        body: {
          email: 'deleted@example.com',
          password: 'Password123',
        },
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.message, 'Invalid email or password.');
    });

    it('rejects login with missing email or password', async () => {
      const res1 = await apiRequest('/login', {
        body: { email: 'user@example.com' },
      });
      assert.strictEqual(res1.status, 400);

      const res2 = await apiRequest('/login', {
        body: { password: 'Password123' },
      });
      assert.strictEqual(res2.status, 400);
    });
  });

  describe('GET /api/auth/me (Protected Route Verification)', () => {
    it('rejects request without Authorization header (401)', async () => {
      const res = await apiRequest('/me', { method: 'GET' });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.error, 'Unauthorized');
    });

    it('rejects request with invalid token (401)', async () => {
      const res = await apiRequest('/me', { method: 'GET', token: 'invalid.token.here' });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.data.error, 'Unauthorized');
    });

    it('returns authenticated user profile when valid token provided', async () => {
      const userId = '10000000-0000-0000-0000-000000000099';
      const token = generateToken({
        id: userId,
        email: 'verified@example.com',
        role: 'student',
      });

      mock.method(pool, 'query', async (queryText, params) => {
        if (queryText.includes('WHERE id = $1 AND deleted_at IS NULL')) {
          assert.strictEqual(params[0], userId);
          return {
            rows: [
              {
                id: userId,
                email: 'verified@example.com',
                role: 'student',
                display_name: 'Verified Student',
                created_at: '2026-01-01T00:00:00.000Z',
                updated_at: '2026-01-01T00:00:00.000Z',
              },
            ],
          };
        }
        throw new Error(`Unexpected query: ${queryText}`);
      });

      const res = await apiRequest('/me', { method: 'GET', token });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.user.id, userId);
      assert.strictEqual(res.data.user.email, 'verified@example.com');
      assert.strictEqual(res.data.user.role, 'student');
      assert.strictEqual(res.data.user.displayName, 'Verified Student');
    });
  });
});
