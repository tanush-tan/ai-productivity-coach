import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticate, requireRole } from '../src/middleware/auth.js';
import { generateToken } from '../src/utils/auth.js';

describe('Auth Middleware', () => {
  const TEST_SECRET = 'test_secret_for_middleware_testing_1234567890';

  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  describe('authenticate', () => {
    function createMockRes() {
      const res = {
        statusCode: null,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.body = data;
          return this;
        },
      };
      return res;
    }

    it('rejects requests with missing Authorization header', () => {
      const req = { headers: {} };
      const res = createMockRes();
      let nextCalled = false;

      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.error, 'Unauthorized');
      assert.match(res.body.message, /Missing or malformed Authorization header/);
    });

    it('rejects requests with malformed Authorization header (non-Bearer)', () => {
      const req = { headers: { authorization: 'Basic dXNlcjpwYXNz' } };
      const res = createMockRes();
      let nextCalled = false;

      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.error, 'Unauthorized');
    });

    it('rejects requests with empty Bearer token', () => {
      const req = { headers: { authorization: 'Bearer   ' } };
      const res = createMockRes();
      let nextCalled = false;

      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert.match(res.body.message, /Empty Bearer token/);
    });

    it('rejects requests with invalid or tampered token', () => {
      const req = { headers: { authorization: 'Bearer this.is.invalid' } };
      const res = createMockRes();
      let nextCalled = false;

      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert.match(res.body.message, /Invalid or malformed authentication token/);
    });

    it('rejects requests with expired token', () => {
      // Create an expired token (expired 1 hour ago)
      const expiredToken = jwt.sign(
        { sub: 'user-123', email: 'test@example.com', role: 'parent', exp: Math.floor(Date.now() / 1000) - 3600 },
        TEST_SECRET
      );

      const req = { headers: { authorization: `Bearer ${expiredToken}` } };
      const res = createMockRes();
      let nextCalled = false;

      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
      assert.match(res.body.message, /token has expired/i);
    });

    it('accepts valid token and attaches authenticated user identity to req.user', () => {
      const user = {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'parent@example.com',
        role: 'parent',
      };
      const validToken = generateToken(user);

      const req = { headers: { authorization: `Bearer ${validToken}` } };
      const res = createMockRes();
      let nextCalled = false;

      authenticate(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(res.statusCode, null);
      assert.deepStrictEqual(req.user, {
        id: user.id,
        email: user.email,
        role: user.role,
      });
    });
  });

  describe('requireRole', () => {
    function createMockRes() {
      const res = {
        statusCode: null,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.body = data;
          return this;
        },
      };
      return res;
    }

    it('allows access when user role matches allowed roles', () => {
      const middleware = requireRole('parent', 'admin');
      const req = { user: { id: '1', role: 'parent' } };
      const res = createMockRes();
      let nextCalled = false;

      middleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true);
      assert.strictEqual(res.statusCode, null);
    });

    it('blocks access with 403 Forbidden when user role does not match', () => {
      const middleware = requireRole('parent');
      const req = { user: { id: '2', role: 'student' } };
      const res = createMockRes();
      let nextCalled = false;

      middleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.error, 'Forbidden');
    });

    it('blocks access with 401 when req.user is missing', () => {
      const middleware = requireRole('parent');
      const req = {};
      const res = createMockRes();
      let nextCalled = false;

      middleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 401);
    });
  });
});
