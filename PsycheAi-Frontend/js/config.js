/* ═══════════════════════════════════════════════════════
   config.js  —  API base URL & global app state
   ═══════════════════════════════════════════════════════ */

const BASE_URL = 'http://localhost:3000';

/* ─────────────────────────────────────────────────────
   APP STATE  (State)
   Single source of truth for the session.
   Persists token / role / user to localStorage.
   ───────────────────────────────────────────────────── */
const S = {
  /* Session */
  token:       null,
  role:        null,   // 'user' | 'hospital' | 'doctor' | 'admin'
  user:        null,

  /* Assessment */
  predictionId: null,
  scores: { emotional: 0, financial: 0, relationship: 0, trauma: 0 },

  /* Booking wizard */
  selectedHospital: null,
  selectedDoctor:   null,
  selectedSlot:     null,
  selectedDate:     null,

  /* ── Persistence ── */
  save() {
    localStorage.setItem('psy_token', S.token || '');
    localStorage.setItem('psy_role',  S.role  || '');
    localStorage.setItem('psy_user',  JSON.stringify(S.user || {}));
  },
  load() {
    S.token = localStorage.getItem('psy_token') || null;
    S.role  = localStorage.getItem('psy_role')  || null;
    try {
      S.user = JSON.parse(localStorage.getItem('psy_user'));
    } catch {
      S.user = null;
    }
  },
  clear() {
    S.token = null;
    S.role  = null;
    S.user  = null;
    localStorage.removeItem('psy_token');
    localStorage.removeItem('psy_role');
    localStorage.removeItem('psy_user');
  },
};

/* ─────────────────────────────────────────────────────
   API HELPER
   Attaches Bearer token automatically when available.
   Always returns { ok: boolean, data: object }.
   ───────────────────────────────────────────────────── */
async function api(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (S.token) headers['Authorization'] = 'Bearer ' + S.token;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(BASE_URL + path, options);
    const data     = await response.json();
    return { ok: response.ok, data };
  } catch (err) {
    console.error('API error:', err);
    return { ok: false, data: { message: 'Network error — is the backend running?' } };
  }
}