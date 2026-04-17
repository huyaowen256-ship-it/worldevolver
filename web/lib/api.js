// Frontend API client — wraps all backend calls
// Place in: web/lib/api.js

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Safe token access — only runs on client
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `请求失败 (${res.status})`);
  }

  return data;
}

// ─── Auth ────────────────────────────────────────────────────

export const api = {
  // Register a new player
  register: (body) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  // Login
  login: (body) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  // ─── Player ────────────────────────────────────────────────

  // Get current player profile
  getMe: () => apiFetch('/api/player/me'),

  // ─── Commands ─────────────────────────────────────────────

  // Submit today's command
  submitCommand: (body) =>
    apiFetch('/api/command', { method: 'POST', body: JSON.stringify(body) }),

  // Get today's command and result
  getTodayCommand: () => apiFetch('/api/command/today'),

  // Get personal logs
  getLogs: (limit = 20) => apiFetch(`/api/logs?limit=${limit}`),

  // ─── World (public) ───────────────────────────────────────

  // Get world bulletins
  getBulletins: (limit = 20) => apiFetch(`/api/world/bulletins?limit=${limit}`),

  // Get leaderboard
  getRanking: () => apiFetch('/api/ranking'),

  // Get graveyard (dead players)
  getGraveyard: () => apiFetch('/api/graveyard'),

  // ─── Rebirth / Karma Inheritance ───────────────────────────

  // Get dead players available for karma inheritance
  getRebirthOptions: () => apiFetch('/api/rebirth/options'),

  // Perform karma inheritance rebirth
  rebirthInherit: (body) =>
    apiFetch('/api/rebirth/inherit', { method: 'POST', body: JSON.stringify(body) }),

  // ─── Admin ─────────────────────────────────────────────────

  // Admin login
  adminLogin: (password) =>
    apiFetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // Get all commands (admin)
  adminGetCommands: () => apiFetch('/api/admin/commands'),

  // Get world state (admin)
  adminGetWorldState: () => apiFetch('/api/admin/world-state'),

  // Get author config
  adminGetConfig: (key) => apiFetch(`/api/admin/config/${key}`),

  // Update author config
  adminPutConfig: (key, value) =>
    apiFetch(`/api/admin/config/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),

  // Manually trigger daily batch
  adminTriggerBatch: () =>
    apiFetch('/api/admin/batch/trigger', { method: 'POST' }),

  // Get batch status
  adminGetBatchStatus: () => apiFetch('/api/admin/batch/status'),

  // ─── Characters ─────────────────────────────────────────────

  // Get character detail by name
  getCharacter: (name) => apiFetch(`/api/characters/${encodeURIComponent(name)}`),
};

// ─── Auth helpers (client-side) ─────────────────────────────

export function saveToken(token) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function isLoggedIn() {
  return !!getStoredToken();
}
