/* ═══════════════════════════════════════════════════════
   router.js  —  Page navigation, toast notifications,
                 nav sync, and logout helpers
   ═══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────
   TOAST
   ───────────────────────────────────────────────────── */

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function toast(message, type = 'success') {
  const container = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className  = 'toast toast-' + type;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ─────────────────────────────────────────────────────
   PAGE NAVIGATION
   ───────────────────────────────────────────────────── */

/** Internal: switch the visible page without touching history. */
function _renderPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    window.scrollTo(0, 0);
  }

  syncNav();

  // Trigger data loaders for dashboard pages
  if (pageId === 'page-user')     loadUserDashboard();
  if (pageId === 'page-hospital') loadHospitalDashboard();
  if (pageId === 'page-doctor')   loadDoctorDashboard();
  if (pageId === 'page-admin')    loadAdminDashboard();
}

/**
 * Navigate to a page and push a history entry.
 * @param {string} pageId  e.g. 'page-landing'
 */
function showPage(pageId) {
  history.pushState({ page: pageId }, '', '#' + pageId);
  _renderPage(pageId);
}

/** Handle browser back/forward buttons. */
window.addEventListener('popstate', (event) => {
  const pageId = event.state?.page || 'page-landing';
  _renderPage(pageId);
});

/* ─────────────────────────────────────────────────────
   NAV SYNC
   ───────────────────────────────────────────────────── */

/** Update the navbar to reflect the current login state. */
function syncNav() {
  const isLoggedIn = !!S.token;

  document.getElementById('nav-guest').style.display  = isLoggedIn ? 'none' : 'flex';
  document.getElementById('nav-logged').style.display = isLoggedIn ? 'flex'  : 'none';

  if (isLoggedIn && S.user) {
    document.getElementById('nav-name').textContent =
      S.user.name || S.user.email || 'Account';
  }
}

/* ─────────────────────────────────────────────────────
   ROUTING HELPERS
   ───────────────────────────────────────────────────── */

const ROLE_TO_PAGE = {
  user:     'page-user',
  hospital: 'page-hospital',
  doctor:   'page-doctor',
  admin:    'page-admin',
};

/** Navigate to the dashboard matching the current role. */
function goDash() {
  const pageId = ROLE_TO_PAGE[S.role];
  showPage(pageId || 'page-landing');
}

/** Navigate to home or dashboard depending on login state. */
function goHome() {
  S.token ? goDash() : showPage('page-landing');
}

/** Log out and return to the landing page. */
function doLogout() {
  S.clear();
  toast('Logged out', 'info');
  showPage('page-landing');
}

/** CTA handler — routes based on current login state. */
function handleStart() {
  if (S.token && S.role === 'user') {
    startTest();
  } else {
    showPage('page-auth');
  }
}