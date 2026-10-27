/**
 * Pairing and Devices API Service
 *
 * Provides functions for parent pairing-code generation, student pairing redemption,
 * and parent device inventory queries.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Requests a new one-time pairing code for the authenticated parent.
 *
 * @param {string} token
 * @returns {Promise<{ code: string, expiresAt: string, expiresInSeconds: number }>}
 */
export async function requestPairingCode(token) {
  if (!token) throw new Error('Authentication required.');

  const res = await fetch(`${API_BASE_URL}/api/pairing/code`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to generate pairing code.');
  }
  return data;
}

/**
 * Checks if the parent has an active unexpired pairing code.
 *
 * @param {string} token
 * @returns {Promise<{ active: boolean, expiresAt?: string, remainingSeconds?: number }>}
 */
export async function fetchActivePairingCodeStatus(token) {
  if (!token) throw new Error('Authentication required.');

  const res = await fetch(`${API_BASE_URL}/api/pairing/code`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to check pairing code status.');
  }
  return data;
}

/**
 * Redeems a pairing code from an authenticated student account.
 *
 * @param {string} token
 * @param {{ code: string, deviceName?: string, deviceType?: string, model?: string }} payload
 * @returns {Promise<{ message: string, parent: object, device: object }>}
 */
export async function redeemPairingCode(token, payload) {
  if (!token) throw new Error('Authentication required.');

  const res = await fetch(`${API_BASE_URL}/api/pairing/redeem`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to redeem pairing code.');
  }
  return data;
}

/**
 * Fetches the student's pairing status and linked parent info.
 *
 * @param {string} token
 * @returns {Promise<{ isPaired: boolean, parent?: object, profile?: object, device?: object }>}
 */
export async function fetchStudentPairingStatus(token) {
  if (!token) throw new Error('Authentication required.');

  const res = await fetch(`${API_BASE_URL}/api/pairing/student-status`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to retrieve student pairing status.');
  }
  return data;
}

/**
 * Fetches devices paired to the authenticated parent account.
 *
 * @param {string} token
 * @returns {Promise<{ devices: Array, totalCount: number }>}
 */
export async function fetchParentDevices(token) {
  if (!token) throw new Error('Authentication required.');

  const res = await fetch(`${API_BASE_URL}/api/devices`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to fetch devices.');
  }
  return data;
}

/**
 * Decommissions / removes a paired device from the parent account.
 *
 * @param {string} token
 * @param {string} deviceId
 * @returns {Promise<{ message: string, device: object }>}
 */
export async function decommissionDevice(token, deviceId) {
  if (!token) throw new Error('Authentication required.');
  if (!deviceId) throw new Error('Device ID is required.');

  const res = await fetch(`${API_BASE_URL}/api/devices/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'Failed to decommission device.');
  }
  return data;
}

