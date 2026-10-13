// Signed-in session: Supabase access and refresh tokens plus the CRM profile, issued by
// POST /api/auth/login. Storage is wrapped in try/catch because some browsers block it
// in private windows; the in-memory copy keeps the session for this page view.

const KEY = 'advisory-crm-session';
let memory = null;

export function getSession() {
  try {
    const stored = sessionStorage.getItem(KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* storage unavailable or an old-format value: fall back to memory */
  }
  return memory;
}

export function saveSession(session) {
  memory = session;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable: the session lasts only for this page view */
  }
}

export function isSignedIn() {
  return Boolean(getSession()?.accessToken);
}

export function signOut() {
  memory = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function currentUser() {
  return getSession()?.user || null;
}

export function currentUserEmail() {
  return currentUser()?.email || '';
}
