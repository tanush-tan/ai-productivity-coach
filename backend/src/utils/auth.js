import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Normalizes email address by trimming whitespace and converting to lowercase.
 *
 * @param {string} email
 * @returns {string}
 */
export function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Validates email format and length.
 *
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 255) return false;
  return EMAIL_REGEX.test(normalized);
}

/**
 * Enforces password security requirements:
 * - Must be at least 8 characters
 * - Must not exceed 128 characters
 * - Must contain at least one letter and at least one number
 *
 * @param {string} password
 * @returns {{ valid: boolean, message?: string }}
 */
export function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password cannot exceed 128 characters' };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter and one number' };
  }
  return { valid: true };
}

/**
 * Validates display name (non-empty, between 2 and 100 characters).
 *
 * @param {string} name
 * @returns {boolean}
 */
export function validateDisplayName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Securely hashes a plaintext password using bcrypt with cost factor 12.
 *
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Compares plaintext password against a bcrypt hash in constant time.
 *
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Retrieves the configured JWT secret. Throws if missing.
 *
 * @returns {string}
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }
  return secret;
}

/**
 * Generates a signed JWT with subject ID, email, and role.
 *
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string}
 */
export function generateToken(user) {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    secret,
    {
      expiresIn,
      algorithm: 'HS256',
    }
  );
}

/**
 * Verifies a JWT token and returns the decoded payload.
 *
 * @param {string} token
 * @returns {object}
 */
export function verifyToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
}
