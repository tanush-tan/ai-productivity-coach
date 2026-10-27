import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateDisplayName,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from '../src/utils/auth.js';

describe('Auth Utilities', () => {
  describe('normalizeEmail', () => {
    it('trims leading/trailing whitespace and lowercases', () => {
      assert.strictEqual(normalizeEmail('  User@Example.COM  '), 'user@example.com');
    });

    it('returns empty string for non-string input', () => {
      assert.strictEqual(normalizeEmail(null), '');
      assert.strictEqual(normalizeEmail(undefined), '');
      assert.strictEqual(normalizeEmail(123), '');
    });
  });

  describe('validateEmail', () => {
    it('accepts valid email addresses', () => {
      assert.strictEqual(validateEmail('parent@example.com'), true);
      assert.strictEqual(validateEmail('student.one+test@school.edu'), true);
    });

    it('rejects invalid email formats', () => {
      assert.strictEqual(validateEmail(''), false);
      assert.strictEqual(validateEmail('notanemail'), false);
      assert.strictEqual(validateEmail('@missinguser.com'), false);
      assert.strictEqual(validateEmail('missingdomain@'), false);
      assert.strictEqual(validateEmail('spaces in@email.com'), false);
      assert.strictEqual(validateEmail(null), false);
    });
  });

  describe('validatePassword', () => {
    it('accepts passwords meeting complexity rules (>=8 chars, letter + number)', () => {
      assert.deepStrictEqual(validatePassword('P@ssword123'), { valid: true });
      assert.deepStrictEqual(validatePassword('securePass99'), { valid: true });
    });

    it('rejects passwords shorter than 8 characters', () => {
      const res = validatePassword('Pass1');
      assert.strictEqual(res.valid, false);
      assert.match(res.message, /at least 8 characters/);
    });

    it('rejects passwords exceeding 128 characters', () => {
      const longPass = 'A1' + 'a'.repeat(127);
      const res = validatePassword(longPass);
      assert.strictEqual(res.valid, false);
      assert.match(res.message, /cannot exceed 128/);
    });

    it('rejects passwords without numbers', () => {
      const res = validatePassword('PasswordOnly');
      assert.strictEqual(res.valid, false);
      assert.match(res.message, /at least one letter and one number/);
    });

    it('rejects passwords without letters', () => {
      const res = validatePassword('1234567890');
      assert.strictEqual(res.valid, false);
      assert.match(res.message, /at least one letter and one number/);
    });

    it('rejects non-string password input', () => {
      assert.strictEqual(validatePassword(null).valid, false);
      assert.strictEqual(validatePassword(undefined).valid, false);
    });
  });

  describe('validateDisplayName', () => {
    it('accepts names between 2 and 100 characters', () => {
      assert.strictEqual(validateDisplayName('Alice Smith'), true);
      assert.strictEqual(validateDisplayName('Bo'), true);
    });

    it('rejects empty, short, or excessively long names', () => {
      assert.strictEqual(validateDisplayName(''), false);
      assert.strictEqual(validateDisplayName(' '), false);
      assert.strictEqual(validateDisplayName('A'), false);
      assert.strictEqual(validateDisplayName('a'.repeat(101)), false);
      assert.strictEqual(validateDisplayName(null), false);
    });
  });

  describe('Password Hashing & Verification', () => {
    it('hashes passwords securely and verifies correctly', async () => {
      const plaintext = 'SuperSecret123';
      const hash = await hashPassword(plaintext);

      assert.notStrictEqual(hash, plaintext);
      assert.match(hash, /^\$2[aby]\$/);

      const isMatch = await comparePassword(plaintext, hash);
      assert.strictEqual(isMatch, true);

      const isWrongMatch = await comparePassword('WrongPassword123', hash);
      assert.strictEqual(isWrongMatch, false);
    });
  });

  describe('JWT Token Generation & Verification', () => {
    it('signs and verifies user payload correctly', () => {
      process.env.JWT_SECRET = 'test_secret_for_unit_tests_1234567890';
      const user = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'test@example.com',
        role: 'parent',
      };

      const token = generateToken(user);
      assert.strictEqual(typeof token, 'string');

      const decoded = verifyToken(token);
      assert.strictEqual(decoded.sub, user.id);
      assert.strictEqual(decoded.email, user.email);
      assert.strictEqual(decoded.role, user.role);
    });

    it('rejects tampered tokens', () => {
      process.env.JWT_SECRET = 'test_secret_for_unit_tests_1234567890';
      const token = generateToken({ id: '1', email: 'a@b.com', role: 'parent' });
      const tampered = token.slice(0, -5) + 'abcde';

      assert.throws(() => verifyToken(tampered));
    });
  });
});
