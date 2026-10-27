import { Router } from 'express';
import { pool } from '../db.js';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validateDisplayName,
  hashPassword,
  comparePassword,
  generateToken,
} from '../utils/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Constant-time dummy hash for timing attack mitigation when user is not found
const DUMMY_HASH = '$2a$12$e8Yg1p2wE1hH6T4F/Kz8euG6U1fB2bK0C3uQ8iK8yA6tZ4d1s5n9e';

/**
 * POST /api/auth/register
 *
 * Registers a new user account (parent or student).
 *
 * Registration Architecture Note:
 * - Creates a credentials record in the `users` table with role 'parent' or 'student'.
 * - For students, this endpoint intentionally does NOT accept or link a `parentId`
 *   or create a `student_profiles` row. The `student_profiles` table requires a valid
 *   parent_id foreign key enforced by `trg_check_student_profile_roles`. Allowing an
 *   unauthenticated registering student to choose an arbitrary parent ID would allow
 *   unauthorized linking and IDOR attacks. Linking between parent and student accounts
 *   is handled separately via authorized pairing codes or parent invitations.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, role } = req.body || {};
    const displayNameRaw = req.body?.displayName ?? req.body?.display_name;

    // 1. Validate Email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A valid email address is required.',
      });
    }
    const normalizedEmail = normalizeEmail(email);

    // 2. Validate Password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: passwordValidation.message,
      });
    }

    // 3. Validate Display Name
    if (!displayNameRaw || !validateDisplayName(displayNameRaw)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Display name is required and must be between 2 and 100 characters.',
      });
    }
    const displayName = displayNameRaw.trim();

    // 4. Validate Role
    if (!role || !['parent', 'student'].includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: "Role must be either 'parent' or 'student'.",
      });
    }

    // 5. Check for Existing Email
    const existingCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1;',
      [normalizedEmail]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
    }

    // 6. Securely Hash Password
    const passwordHash = await hashPassword(password);

    // 7. Insert User Record using Parameterized Query
    const insertResult = await pool.query(
      `INSERT INTO users (email, password_hash, role, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, display_name, created_at;`,
      [normalizedEmail, passwordHash, role, displayName]
    );

    const newUser = insertResult.rows[0];

    // 8. Generate JWT Token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // 9. Respond with Safe User Object (no password_hash)
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        displayName: newUser.display_name,
        createdAt: newUser.created_at,
      },
      token,
    });
  } catch (err) {
    // Check for PostgreSQL unique constraint violation on email
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.',
      });
    }

    console.error('[Auth Registration Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating your account. Please try again later.',
    });
  }
});

/**
 * POST /api/auth/login
 *
 * Authenticates user credentials and issues a JWT token.
 * Uses generic error messages to avoid revealing whether an email exists.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Retrieve active user by normalized email
    const result = await pool.query(
      `SELECT id, email, password_hash, role, display_name, deleted_at
       FROM users
       WHERE email = $1;`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    // Mitigate timing attack if user not found or is soft-deleted
    if (!user || user.deleted_at !== null) {
      await comparePassword(password, DUMMY_HASH);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // Compare password with stored bcrypt hash
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return safe user object (excluding password_hash)
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
      },
      token,
    });
  } catch (err) {
    console.error('[Auth Login Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during login. Please try again later.',
    });
  }
});

/**
 * GET /api/auth/me
 *
 * Protected endpoint returning the profile of the currently authenticated user.
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, display_name, created_at, updated_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL;`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User account not found or has been deactivated.',
      });
    }

    const user = result.rows[0];

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
        createdAt: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (err) {
    console.error('[Auth Profile Error]', err.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile.',
    });
  }
});

export default router;
