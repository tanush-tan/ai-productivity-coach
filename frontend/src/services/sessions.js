/**
 * Study Sessions API Service
 *
 * Provides API functions for starting and ending student study sessions.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Starts a new study session for the authenticated student.
 *
 * @param {string} token - JWT bearer token
 * @param {object} payload - { subject, goalText, title, deviceId }
 * @returns {Promise<{ message: string, session: object }>}
 */
export async function startStudySession(token, payload = {}) {
  if (!token) throw new Error('Authentication required.');

  const res = await fetch(`${API_BASE_URL}/api/sessions/start`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to start study session.');
  }
  return data;
}

/**
 * Fetches the authenticated student's session history, newest first.
 *
 * @param {string} token - JWT bearer token
 * @param {object} options - { limit, offset }
 * @returns {Promise<{ sessions: object[], pagination: object }>}
 */
export async function fetchStudentSessions(token, { limit = 50, offset = 0 } = {}) {
  if (!token) throw new Error('Authentication required.');

  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetch(`${API_BASE_URL}/api/sessions?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to fetch study sessions.');
  }
  return data;
}

/**
 * Ends an active study session for the authenticated student.
 *
 * @param {string} token - JWT bearer token
 * @param {string} sessionId - UUID of the active session
 * @param {object} payload - { notes, status }
 * @returns {Promise<{ message: string, session: object }>}
 */
export async function endStudySession(token, sessionId, payload = {}) {
  if (!token) throw new Error('Authentication required.');
  if (!sessionId) throw new Error('Session ID is required.');

  const res = await fetch(`${API_BASE_URL}/api/sessions/${encodeURIComponent(sessionId)}/end`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to end study session.');
  }
  return data;
}
