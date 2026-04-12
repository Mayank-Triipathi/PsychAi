/* ═══════════════════════════════════════════════════════
   auth.js  —  Login, registration, and role picker
   ═══════════════════════════════════════════════════════ */

let activeRole = 'user';   // 'user' | 'hospital' | 'doctor' | 'admin'
let activeTab  = 'login';  // 'login' | 'register'

/* ─────────────────────────────────────────────────────
   ROLE SELECTOR
   ───────────────────────────────────────────────────── */

function pickRole(role) {
  activeRole = role;
  document.querySelectorAll('.role-pick').forEach(el => el.classList.remove('sel'));
  document.getElementById('role-' + role).classList.add('sel');
  renderAuthForm();
}

/* ─────────────────────────────────────────────────────
   TAB SWITCHER
   ───────────────────────────────────────────────────── */

function switchTab(tab) {
  activeTab = tab;

  const loginBtn    = document.getElementById('tab-login');
  const registerBtn = document.getElementById('tab-register');
  const inactiveStyle = 'flex:1;border-radius:9px;border:none;background:transparent;color:var(--mid);font-family:Nunito,sans-serif;font-size:15px;font-weight:700;cursor:pointer;padding:12px 24px;';

  if (tab === 'login') {
    loginBtn.className    = 'btn btn-primary';
    loginBtn.style.cssText = 'flex:1;border-radius:9px';
    registerBtn.className  = 'btn';
    registerBtn.style.cssText = inactiveStyle;
  } else {
    registerBtn.className    = 'btn btn-primary';
    registerBtn.style.cssText = 'flex:1;border-radius:9px';
    loginBtn.className  = 'btn';
    loginBtn.style.cssText = inactiveStyle;
  }

  renderAuthForm();
}

/* ─────────────────────────────────────────────────────
   FORM RENDERER
   ───────────────────────────────────────────────────── */

const ROLE_ICONS = { user: '👤', hospital: '🏥', doctor: '👨‍⚕️', admin: '🛡️' };

const REGISTER_RESTRICTED_MESSAGES = {
  hospital: 'Hospitals: use the <strong>Register Hospital</strong> link below.',
  doctor:   'Doctors are added by their hospital admin.',
  admin:    'Admin accounts are created by the system.',
};

function renderAuthForm() {
  const formArea = document.getElementById('auth-form-area');
  if (!formArea) return;

  const roleName       = activeRole.charAt(0).toUpperCase() + activeRole.slice(1);
  const canSelfRegister = activeRole === 'user';

  // Non-user roles can't self-register
  if (activeTab === 'register' && !canSelfRegister) {
    formArea.innerHTML = `
      <div class="alert alert-info">
        ${REGISTER_RESTRICTED_MESSAGES[activeRole]} Please use Sign In.
      </div>`;
    return;
  }

  formArea.innerHTML = activeTab === 'login'
    ? buildLoginForm(roleName)
    : buildRegisterForm();
}

function buildLoginForm(roleName) {
  return `
    <div style="text-align:center;margin-bottom:22px">
      <span style="font-size:38px">${ROLE_ICONS[activeRole]}</span>
      <h2 style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-top:8px">
        Sign in as ${roleName}
      </h2>
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input class="form-control" id="login-email" type="email" placeholder="your@email.com"
             onkeydown="if(event.key==='Enter') doLogin()">
    </div>
    <div class="form-group">
      <label class="form-label">Password</label>
      <input class="form-control" id="login-password" type="password" placeholder="••••••••"
             onkeydown="if(event.key==='Enter') doLogin()">
    </div>
    <button class="btn btn-primary btn-full btn-lg" style="margin-top:4px" onclick="doLogin()">
      Sign In 🌿
    </button>`;
}

function buildRegisterForm() {
  return `
    <div style="text-align:center;margin-bottom:22px">
      <span style="font-size:38px">🌱</span>
      <h2 style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;margin-top:8px">
        Create Account
      </h2>
    </div>
    <div class="grid-2">
      <div class="form-group">
        <label class="form-label">Full Name</label>
        <input class="form-control" id="reg-name" placeholder="Your name">
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="reg-phone" placeholder="Phone number">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input class="form-control" id="reg-email" type="email" placeholder="your@email.com">
    </div>
    <div class="form-group">
      <label class="form-label">Password</label>
      <input class="form-control" id="reg-password" type="password" placeholder="Choose a password">
    </div>
    <div class="form-group">
      <label class="form-label">Address</label>
      <input class="form-control" id="reg-address" placeholder="Your address">
    </div>
    <div class="grid-2">
      <div class="form-group">
        <label class="form-label">Latitude</label>
        <input class="form-control" id="reg-lat" type="number" step="any" placeholder="28.6139">
      </div>
      <div class="form-group">
        <label class="form-label">Longitude</label>
        <input class="form-control" id="reg-lng" type="number" step="any" placeholder="77.2090">
      </div>
    </div>
    <button class="btn btn-primary btn-full btn-lg" onclick="doRegister()">
      Create Account 🌱
    </button>`;
}

/* ─────────────────────────────────────────────────────
   LOGIN
   ───────────────────────────────────────────────────── */

const LOGIN_ENDPOINTS = {
  user:     '/auth/user/login',
  hospital: '/auth/hospital/login',
  doctor:   '/auth/doctor/login',
  admin:    '/auth/admin/login',
};

async function doLogin() {
  const email    = document.getElementById('login-email')?.value?.trim();
  const password = document.getElementById('login-password')?.value;

  if (!email || !password) {
    toast('Please fill in all fields', 'error');
    return;
  }

  const res = await api(LOGIN_ENDPOINTS[activeRole], 'POST', { email, password });
  if (!res.ok) {
    toast(res.data.message || 'Login failed', 'error');
    return;
  }

  const payload = res.data.data || res.data;
  S.token = payload.token;
  S.role  = activeRole;
  S.user  = payload[activeRole] || payload.user || payload.hospital || payload.doctor || payload.admin || {};
  S.save();

  toast('Welcome back! 🌿', 'success');
  goDash();
}

/* ─────────────────────────────────────────────────────
   REGISTER — USER
   ───────────────────────────────────────────────────── */

async function doRegister() {
  const name     = document.getElementById('reg-name')?.value?.trim();
  const phone    = document.getElementById('reg-phone')?.value?.trim();
  const email    = document.getElementById('reg-email')?.value?.trim();
  const password = document.getElementById('reg-password')?.value;
  const address  = document.getElementById('reg-address')?.value?.trim();
  const lat      = parseFloat(document.getElementById('reg-lat')?.value  || 0);
  const lng      = parseFloat(document.getElementById('reg-lng')?.value || 0);

  if (!name || !email || !password) {
    toast('Name, email and password are required', 'error');
    return;
  }

  const res = await api('/auth/user/register', 'POST', {
    name, email, phone, password, address, latitude: lat, longitude: lng,
  });

  if (!res.ok) {
    toast(res.data.message || 'Registration failed', 'error');
    return;
  }

  const payload = res.data.data || res.data;
  S.token = payload.token;
  S.role  = 'user';
  S.user  = payload.user || {};
  S.save();

  toast('Account created! Welcome 🌱', 'success');
  showPage('page-user');
}

/* ─────────────────────────────────────────────────────
   REGISTER — HOSPITAL
   ───────────────────────────────────────────────────── */

async function doHospReg() {
  const name     = document.getElementById('hr-name')?.value?.trim();
  const email    = document.getElementById('hr-email')?.value?.trim();
  const password = document.getElementById('hr-pass')?.value;
  const address  = document.getElementById('hr-addr')?.value?.trim();
  const lat      = parseFloat(document.getElementById('hr-lat')?.value  || 0);
  const lng      = parseFloat(document.getElementById('hr-lng')?.value || 0);

  if (!name || !email || !password) {
    toast('Name, email and password are required', 'error');
    return;
  }

  const res = await api('/auth/hospital/register', 'POST', {
    name, email, password, address, lat, lng,
  });

  if (!res.ok) {
    toast(res.data.message || 'Registration failed', 'error');
    return;
  }

  toast('Hospital registered! Awaiting admin verification 🏥', 'success');
  showPage('page-auth');
}