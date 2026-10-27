/**
 * Authentication Service
 *
 * Connects frontend authentication flows to the backend Express API.
 * Uses VITE_API_URL if configured, falling back to localhost:5000 in development.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_STORAGE_KEY = 'ai_productivity_coach_token';

/**
 * Retrieves the stored JWT from local storage.
 * @returns {string | null}
 */
export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Stores the JWT in local storage.
 * @param {string} token
 */
export function setStoredToken(token) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage quota or private browsing exceptions handled silently
  }
}

/**
 * Removes the stored JWT from local storage.
 */
export function removeStoredToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage exceptions handled silently
  }
}

/**
 * Performs login request against POST /api/auth/login.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: { id: string, email: string, role: string, displayName: string }, token: string }>}
 */
export async function loginUser(email, password) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      'Unable to connect to the authentication server. Please verify the backend is running.'
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Unexpected response format received from authentication server.');
  }

  if (!response.ok) {
    const errorMessage = data?.message || 'Authentication failed. Please check your credentials.';
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Performs registration request against POST /api/auth/register.
 *
 * @param {{ email: string, password: string, displayName: string, role: string }} payload
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function registerUser({ email, password, displayName, role }) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, displayName, role }),
    });
  } catch {
    throw new Error(
      'Unable to connect to the authentication server. Please verify the backend is running.'
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Unexpected response format received from authentication server.');
  }

  if (!response.ok) {
    const errorMessage = data?.message || 'Registration failed. Please try again.';
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Retrieves the current authenticated user profile using GET /api/auth/me.
 *
 * @param {string} token
 * @returns {Promise<{ user: { id: string, email: string, role: string, displayName: string } }>}
 */
export async function fetchCurrentUser(token) {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error('Unable to connect to the authentication server.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Unexpected response format received from authentication server.');
  }

  if (!response.ok) {
    const errorMessage = data?.message || 'Session expired or invalid.';
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return data;
}
