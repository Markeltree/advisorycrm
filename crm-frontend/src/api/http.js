// Real backend client. Every call maps to a route on the Node.js API (crm-backend).
// Sends the Supabase access token, refreshes it shortly before it expires, and retries
// once after a 401. If the refresh fails the session is cleared and the user signs in again.

import { getSession, saveSession, signOut } from '../lib/session.js';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const REFRESH_MARGIN_MS = 60_000;

let refreshing = null;

function refreshSession() {
  const refreshToken = getSession()?.refreshToken;
  if (!refreshToken) return Promise.resolve(false);
  refreshing ??= fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) return false;
      saveSession(await response.json());
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function endSession() {
  signOut();
  if (window.location.pathname !== '/signin') window.location.assign('/signin');
}

async function request(path, { method = 'GET', body, query, auth = true, retry = true } = {}) {
  const qs = query
    ? '?' +
      new URLSearchParams(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all')
      ).toString()
    : '';

  if (auth) {
    const expiresAt = getSession()?.expiresAt;
    if (expiresAt && expiresAt * 1000 - Date.now() < REFRESH_MARGIN_MS) await refreshSession();
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = getSession()?.accessToken;
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}${qs === '?' ? '' : qs}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }

  if (response.status === 401 && auth) {
    if (retry && (await refreshSession())) return request(path, { method, body, query, auth, retry: false });
    endSession();
    throw new Error('Your session expired. Sign in again.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `The server returned ${response.status}. Try again.`);
  }

  return response.status === 204 ? null : response.json();
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  logout: () => request('/auth/logout', { method: 'POST', retry: false }),

  listContacts: (filters) => request('/contacts', { query: filters }),
  getContact: (id) => request(`/contacts/${id}`),
  createContact: (payload) => request('/contacts', { method: 'POST', body: payload }),
  updateContactStage: (id, stage) => request(`/contacts/${id}/stage`, { method: 'PATCH', body: { stage } }),
  optOutContact: (id, details) => request(`/contacts/${id}/opt-out`, { method: 'POST', body: details }),

  listApprovals: (status) => request('/approvals', { query: { status } }),
  decideApproval: (id, decision) => request(`/approvals/${id}/decision`, { method: 'POST', body: decision }),

  listWorkflows: () => request('/workflows'),
  getDashboard: () => request('/metrics/dashboard'),
  listComplianceEvents: () => request('/compliance/events'),
};
