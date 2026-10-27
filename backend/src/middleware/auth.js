import { verifyToken } from '../utils/auth.js';

/**
 * Authentication middleware: verifies Bearer token in Authorization header.
 * Attaches the authenticated user's id, email, and role to `req.user`.
 *
 * Does not trust any client-supplied user ID or role parameter.
 * Never logs raw tokens, secrets, or passwords.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Missing or malformed Authorization header.',
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Empty Bearer token.',
    });
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded.sub || !decoded.role) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token payload.',
      });
    }

    // Attach verified user identity from token to the request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or malformed authentication token.',
    });
  }
}

/**
 * Role-authorization middleware factory: restricts routes to specific roles.
 * Must be mounted AFTER `authenticate` middleware.
 *
 * @param {...string} allowedRoles
 * @returns {import('express').RequestHandler}
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: insufficient permissions for this resource.',
      });
    }

    next();
  };
}
