/* ═══════════════════════════════════════════════════════
   booking.js  —  Appointment booking flow
                  4 steps: Hospital → Doctor → Slot → Confirm
   ═══════════════════════════════════════════════════════ */

const DAYS_OF_WEEK = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

let currentBookingStep = 1;

/* ─────────────────────────────────────────────────────
   ENTRY POINT
   ───────────────────────────────────────────────────── */

function initBooking() {
  if (!S.token || S.role !== 'user') {
    toast('Please log in as a user first', 'error');
    showPage('page-auth');
    return;
  }
  if (!S.predictionId) {
    toast('Please complete the wellness test first', 'error');
    startTest();
    return;
  }

  currentBookingStep    = 1;
  S.selectedHospital = null;
  S.selectedDoctor   = null;
  S.selectedSlot     = null;

  goToStep(1);
}

/* ─────────────────────────────────────────────────────
   STEP NAVIGATION
   ───────────────────────────────────────────────────── */

function goToStep(step) {
  currentBookingStep = step;

  // Show/hide panels
  [1, 2, 3, 4].forEach(i => {
    document.getElementById('b-step' + i).style.display = i === step ? 'block' : 'none';
  });

  // Update step indicator circles
  [1, 2, 3, 4].forEach(i => {
    const circle = document.getElementById('sc' + i);
    if (circle) {
      circle.className = 'step-circle' +
        (i < step ? ' done' : i === step ? ' active' : '');
    }
  });

  // Update connector lines
  [1, 2, 3].forEach(i => {
    const line = document.getElementById('sl' + i);
    if (line) line.className = 'step-line' + (i < step ? ' done' : '');
  });

  // Load data for each step
  if (step === 1) loadNearbyHospitals();
  if (step === 3) loadAvailableSlots();
  if (step === 4) renderConfirmation();
}

/* ─────────────────────────────────────────────────────
   STEP 1 — SELECT HOSPITAL
   ───────────────────────────────────────────────────── */

async function loadNearbyHospitals() {
  const container = document.getElementById('b-hospitals');
  container.innerHTML = `
    <div class="loading-box">
      <div class="spinner"></div>
      <span>Finding hospitals nearby…</span>
    </div>`;

  // Use saved location or Delhi as fallback
  let lat = S.user?.location?.lat || 28.6139;
  let lng = S.user?.location?.lng || 77.2090;

  try {
    const position = await new Promise((resolve, reject) =>
      navigator.geolocation?.getCurrentPosition(resolve, reject, { timeout: 3000 }) ?? reject()
    );
    lat = position.coords.latitude;
    lng = position.coords.longitude;
  } catch {
    // Silently fall back to default coords
  }

  const res = await api(`/api/nearby-hospitals?lat=${lat}&lng=${lng}`);

  if (!res.ok || !Array.isArray(res.data) || !res.data.length) {
    container.innerHTML = `
      <div class="alert alert-info">
        No verified hospitals found nearby. Check back later.
      </div>`;
    return;
  }

  container.innerHTML = res.data.map(hospital => `
    <div class="pick-card ${S.selectedHospital?._id === hospital._id ? 'sel' : ''}"
         onclick='selectHospital(${JSON.stringify(hospital)})'>
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:44px;height:44px;background:linear-gradient(135deg,var(--sky-light),var(--sky));
                    border-radius:13px;display:flex;align-items:center;justify-content:center;
                    font-size:22px;flex-shrink:0">🏥</div>
        <div style="flex:1">
          <p style="font-weight:800;font-size:15px">${hospital.name}</p>
          <p style="font-size:12px;color:var(--mid)">${hospital.address || ''}</p>
        </div>
        ${S.selectedHospital?._id === hospital._id
          ? '<span style="color:var(--sage);font-size:20px;font-weight:900">✓</span>'
          : ''}
      </div>
    </div>
  `).join('');
}

function selectHospital(hospital) {
  S.selectedHospital = hospital;
  loadNearbyHospitals();  // Re-render to show checkmark
}

/* ─────────────────────────────────────────────────────
   STEP 2 — AI-MATCH DOCTOR
   ───────────────────────────────────────────────────── */


async function goMatchDoctor() {
  if (!S.selectedHospital) {
    toast('Please select a hospital', 'error');
    return;
  }

  goToStep(2);

  const container = document.getElementById('b-doctor');
  container.innerHTML = `
    <div class="loading-box">
      <div class="spinner"></div>
      <span>Matching you with the best doctor…</span>
    </div>`;

  // ❌ REMOVED DAY LOGIC HERE

  const res = await api('/api/match-doctor', 'POST', {
    predictionId: S.predictionId,
    hospitalId:   S.selectedHospital._id
  });

  if (!res.ok || !res.data?.doctor) {
    container.innerHTML = `
      <div class="alert alert-error">
        ${res.data?.message || 'No doctors available right now'}
      </div>`;
    return;
  }

  const { doctor, primaryProblem = 'General', score = 85 } = res.data;
  S.selectedDoctor = doctor;

  const specializationTags = (doctor.specialization || [])
    .map(spec => `<span class="tag tag-sage">${spec}</span>`)
    .join('');

  container.innerHTML = `
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:44px;margin-bottom:8px">🎯</div>
      <p style="font-size:12px;color:var(--mid);font-weight:700">
        AI MATCHED SPECIALIST · ${primaryProblem} Focus
      </p>
    </div>

    <div class="pick-card sel" style="cursor:default">
      <div style="display:flex;align-items:center;gap:16px">
        <div class="avatar avatar-lg">${doctor.name?.charAt(0) || 'D'}</div>
        <div style="flex:1">
          <p style="font-size:18px;font-weight:900">${doctor.name}</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
            ${specializationTags}
          </div>
        </div>
        <div style="text-align:center;padding:10px 16px;background:rgba(124,174,122,0.1);
                    border-radius:12px">
          <div style="font-size:28px;font-weight:900;color:var(--sage-dark)">
            ${score}%
          </div>
          <div style="font-size:10px;color:var(--mid);font-weight:700">MATCH</div>
        </div>
      </div>
    </div>

    <button class="btn btn-primary" style="margin-top:18px" onclick="goToStep(3)">
      Choose a Time Slot →
    </button>`;
}
/* ─────────────────────────────────────────────────────
   STEP 3 — SELECT TIME SLOT
   ───────────────────────────────────────────────────── */

async function loadAvailableSlots() {
  const container = document.getElementById('b-slots');
  container.innerHTML = `
    <div class="loading-box">
      <div class="spinner"></div>
      <span>Loading available slots…</span>
    </div>`;

  const today = new Date();
  S.selectedDate = today.toISOString().split('T')[0];
  const dayName      = DAYS_OF_WEEK[today.getDay()];

  const res = await api('/api/get-slots', 'POST', {
    doctorId: S.selectedDoctor._id,
    date:     S.selectedDate,
    day:      dayName,
  });

  if (!res.ok || !res.data.slots?.length) {
    container.innerHTML = `
      <div class="alert alert-info">
        No slots available today. Please try tomorrow.
      </div>`;
    return;
  }

  const dateDisplay = today.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const slotButtons = res.data.slots.map(slot => `
    <button class="slot-btn ${S.selectedSlot === slot ? 'sel' : ''}"
            onclick="selectSlot('${slot}')">
      ${slot}
    </button>
  `).join('');

  container.innerHTML = `
    <p style="font-size:13px;color:var(--mid);font-weight:700;margin-bottom:14px">
      📅 ${dateDisplay}
    </p>
    <div class="slot-grid">${slotButtons}</div>
    <button class="btn btn-primary" style="margin-top:22px" onclick="confirmSlot()">
      Continue →
    </button>`;
}

function selectSlot(slot) {
  S.selectedSlot = slot;
  document.querySelectorAll('.slot-btn').forEach(btn =>
    btn.classList.toggle('sel', btn.textContent.trim() === slot)
  );
}

function confirmSlot() {
  if (!S.selectedSlot) {
    toast('Please select a time slot', 'error');
    return;
  }
  goToStep(4);
}

/* ─────────────────────────────────────────────────────
   STEP 4 — CONFIRM & BOOK
   ───────────────────────────────────────────────────── */

function renderConfirmation() {
  const dateDisplay = new Date(S.selectedDate + 'T00:00:00')
    .toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const summaryRows = [
    ['Doctor',   S.selectedDoctor?.name   || '—'],
    ['Hospital', S.selectedHospital?.name || '—'],
    ['Date',     dateDisplay],
    ['Time',     S.selectedSlot],
  ].map(([label, value]) => `
    <div style="display:flex;justify-content:space-between;padding:10px 0;
                border-bottom:1px solid rgba(124,174,122,0.08)">
      <span style="font-size:12px;font-weight:700;color:var(--mid);
                   text-transform:uppercase;letter-spacing:0.5px">
        ${label}
      </span>
      <span style="font-size:15px;font-weight:800;
                   color:${label === 'Time' ? 'var(--sage-dark)' : 'var(--dark)'}">
        ${value}
      </span>
    </div>
  `).join('');

  document.getElementById('b-confirm').innerHTML = `
    <div style="text-align:center;margin-bottom:28px">
      <div style="font-size:44px;margin-bottom:10px">📋</div>
      <h2 style="font-family:'Playfair Display',serif;font-size:24px">
        Confirm Your Appointment
      </h2>
    </div>

    <div class="card card-p" style="margin-bottom:18px">${summaryRows}</div>

    <button class="btn btn-primary btn-full btn-lg" onclick="doBookAppointment()">
      Confirm Booking 🌿
    </button>
    <button class="btn btn-outline btn-full" style="margin-top:10px" onclick="goToStep(3)">
      ← Change Slot
    </button>`;
}

async function doBookAppointment() {
  const todayName = DAYS_OF_WEEK[new Date().getDay()];

  const res = await api('/api/book-appointment', 'POST', {
    userId:     S.user._id,
    doctorId:   S.selectedDoctor._id,
    hospitalId: S.selectedHospital._id,
    date:       S.selectedDate,
    slot:       S.selectedSlot,
    day:        todayName,
  });

  if (!res.ok) {
    toast(res.data.message || 'Booking failed', 'error');
    return;
  }

  toast('Appointment booked! 🎉', 'success');
  showPage('page-user');
}