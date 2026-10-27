import crypto from 'node:crypto';

// Unambiguous base32-style alphabet excluding easily confused characters (0, O, 1, I, L)
const PAIRING_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates an unpredictable, cryptographically secure 12-character pairing code
 * formatted as 3 blocks of 4 characters: `XXXX-XXXX-XXXX`.
 *
 * Entropy: 32^12 = 2^60 combinations (~1.15 quintillion possibilities).
 * Combined with a 10-minute expiry and attempt-count locking, this prevents
 * brute-force guessing attacks.
 *
 * @returns {string}
 */
export function generatePairingCode() {
  const bytes = crypto.randomBytes(12);
  let code = '';
  for (let i = 0; i < 12; i++) {
    // Select from the 32-character alphabet
    const charIndex = bytes[i] % PAIRING_CHARSET.length;
    code += PAIRING_CHARSET[charIndex];
    if (i === 3 || i === 7) {
      code += '-';
    }
  }
  return code;
}

/**
 * Normalizes a pairing code by removing spaces, hyphens, and converting to uppercase.
 *
 * @param {string} code
 * @returns {string}
 */
export function normalizePairingCode(code) {
  if (typeof code !== 'string') return '';
  return code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Computes a SHA-256 hash of the normalized pairing code.
 * Only the hash is ever stored in the database.
 *
 * @param {string} code
 * @returns {string}
 */
export function hashPairingCode(code) {
  const normalized = normalizePairingCode(code);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Generates a unique permanent device code assigned after pairing.
 *
 * @returns {string}
 */
export function generateDeviceCode() {
  return `DEV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}
