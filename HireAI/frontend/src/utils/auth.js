const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001';

export const AUTH_STORAGE_KEY = 'talentsync_user';
export const TOKEN_STORAGE_KEY = 'token';
export const API_URL = API_BASE_URL;

export function saveSession(userData, token) {
  const session = {
    token,
    name: userData?.name || userData?.full_name || '',
    role: userData?.role || 'manager',
    company_name: userData?.company_name || '',
    permissions: userData?.permissions || {},
  };

  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isManager(session = getSession()) {
  return session?.role === 'manager';
}

export function canAccessSensitive(session = getSession()) {
  return session?.permissions?.can_view_sensitive_info || isManager(session);
}

export function canManageJobs(session = getSession()) {
  return session?.permissions?.can_manage_jobs || isManager(session);
}

export function canManageCandidates(session = getSession()) {
  return session?.permissions?.can_manage_candidates || isManager(session);
}

export function canScheduleInterviews(session = getSession()) {
  return session?.permissions?.can_schedule_interviews || isManager(session);
}

export function canViewOffers(session = getSession()) {
  return session?.permissions?.can_view_offers || isManager(session);
}

export async function fetchCurrentUser() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return null;

  const response = await fetch(`${API_URL}/api/me`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  saveSession(data.user, token);
  return data;
}
