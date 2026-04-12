/* ═══════════════════════════════════════════════════════
   dashboards.js  —  User, Hospital, Doctor, Admin dashboards
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   USER DASHBOARD
   ═══════════════════════════════════════════════════════ */

async function loadUserDashboard() {
  if (!S.token || S.role !== 'user') return;

  const name = S.user?.name || 'there';
  document.getElementById('u-greeting').textContent = `Hello, ${name} 👋`;

  const res          = await api('/api/user/appointments');
  const appointments = res.ok
    ? (Array.isArray(res.data) ? res.data : res.data.data || [])
    : [];

  const upcoming = appointments.filter(a => a.status !== 'cancelled');

  document.getElementById('u-total').textContent    = appointments.length;
  document.getElementById('u-upcoming').textContent = upcoming.length;

  const container = document.getElementById('u-appts');
  if (!container) return;

  if (!appointments.length) {
    container.innerHTML = `
      <div class="empty-S">
        <div class="empty-icon">🌿</div>
        <h3>No appointments yet</h3>
        <p>Take the stress test to get matched with a doctor</p>
        <button class="btn btn-primary" style="margin-top:20px" onclick="startTest()">
          Start Wellness Test
        </button>
      </div>`;
    return;
  }

  container.innerHTML = appointments.map(appointment => `
    <div class="card card-p" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div class="avatar">${appointment.doctor?.name?.charAt(0) || 'D'}</div>
        <div style="flex:1">
          <p style="font-weight:800;font-size:16px">${appointment.doctor?.name || 'Doctor'}</p>
          <p style="font-size:13px;color:var(--mid)">${appointment.hospital?.name || 'Hospital'}</p>
          <div style="display:flex;gap:12px;margin-top:6px;flex-wrap:wrap">
            <span style="font-size:13px;color:var(--dark-soft)">
              📅 ${new Date(appointment.date).toLocaleDateString('en-IN', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </span>
            <span style="font-size:13px;color:var(--dark-soft)">🕐 ${appointment.slot}</span>
          </div>
        </div>
        <span class="badge badge-${appointment.status || 'pending'}">
          ${(appointment.status || 'pending').toUpperCase()}
        </span>
      </div>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════════════════
   HOSPITAL DASHBOARD
   ═══════════════════════════════════════════════════════ */

async function loadHospitalDashboard() {
  if (!S.token || S.role !== 'hospital') return;

  document.getElementById('h-sidebar-name').textContent = S.user?.name || 'Hospital';

  const [appointmentRes, doctorRes] = await Promise.all([
    api('/api/hospital/appointments'),
    api('/api/hospital/doctors'),
  ]);

  const appointments = appointmentRes.ok
    ? (Array.isArray(appointmentRes.data) ? appointmentRes.data : appointmentRes.data.data || [])
    : [];

  const doctors = doctorRes.ok
    ? (Array.isArray(doctorRes.data) ? doctorRes.data : doctorRes.data.data || [])
    : [];

  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  document.getElementById('h-appts').textContent   = appointments.length;
  document.getElementById('h-docs').textContent    = doctors.length;
  document.getElementById('h-pending').textContent = pendingCount;

  renderHospitalAppointments(appointments);
  renderHospitalDoctors(doctors);
}

function renderHospitalAppointments(appointments) {
  const container = document.getElementById('h-appts-list');
  if (!container) return;

  if (!appointments.length) {
    container.innerHTML = `
      <div class="empty-S">
        <div class="empty-icon">📋</div>
        <h3>No appointments yet</h3>
      </div>`;
    return;
  }

  const rows = appointments.map(a => `
    <tr>
      <td><strong>${a.user?.name || 'User'}</strong></td>
      <td>${a.doctor?.name || '—'}</td>
      <td>${new Date(a.date).toLocaleDateString('en-IN')}</td>
      <td>${a.slot}</td>
      <td>
        <span class="badge badge-${a.status || 'pending'}">
          ${(a.status || 'pending').toUpperCase()}
        </span>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date</th>
            <th>Slot</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderHospitalDoctors(doctors) {
  const container = document.getElementById('h-docs-list');
  if (!container) return;

  if (!doctors.length) {
    container.innerHTML = `
      <div class="empty-S">
        <div class="empty-icon">👨‍⚕️</div>
        <h3>No doctors added yet</h3>
        <p>Add your first doctor to start accepting appointments</p>
      </div>`;
    return;
  }

  container.innerHTML = doctors.map(doctor => {
    const specializationTags = (doctor.specialization || [])
      .map(spec => `<span class="tag tag-sage">${spec}</span>`)
      .join('');

    const statusClass = doctor.isActive ? 'badge-confirmed' : 'badge-cancelled';
    const statusLabel = doctor.isActive ? 'ACTIVE' : 'INACTIVE';

    return `
      <div class="card card-p" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:14px">
          <div class="avatar">${doctor.name?.charAt(0) || 'D'}</div>
          <div style="flex:1">
            <p style="font-weight:800;font-size:15px">${doctor.name}</p>
            <div class="specializations" style="margin-top:6px">${specializationTags}</div>
          </div>
          <span class="badge ${statusClass}">${statusLabel}</span>
        </div>
      </div>`;
  }).join('');
}

/* ── Add Doctor Modal ── */


function openAddDoc() {
  document.getElementById('modal-add-doc').classList.add('open');
}

function closeAddDoc() {
  document.getElementById('modal-add-doc').classList.remove('open');
}

async function submitAddDoc() {
  const name  = document.getElementById('ad-name')?.value?.trim();
  const specs = document.getElementById('ad-specs')?.value
    ?.split(',').map(s => s.trim()).filter(Boolean);
  const availText = document.getElementById('ad-avail')?.value?.trim();

  if (!name || !specs?.length) {
    toast('Name and specialization are required', 'error');
    return;
  }

  let availability = [];
  try {
    availability = JSON.parse(availText || '[]');
  } catch {
    availability = availText
      ? [{ day: availText, startTime: '09:00', endTime: '17:00', slotDuration: 30 }]
      : [];
  }

  const res = await api('/api/hospital/add-doctor', 'POST', {
    name, specialization: specs, availability,
  });

  if (!res.ok) {
    toast(res.data.message || 'Failed to add doctor', 'error');
    return;
  }

  toast('Doctor added successfully! 🎉', 'success');
  closeAddDoc();

  // Clear form fields
  ['ad-name', 'ad-specs', 'ad-avail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  loadHospitalDashboard();
}

/* ── Hospital panel tabs ── */

function hTab(tabName) {
  const showAppts = tabName === 'appts';

  document.getElementById('h-panel-appts').style.display = showAppts ? 'block' : 'none';
  document.getElementById('h-panel-docs').style.display  = showAppts ? 'none'  : 'block';

  document.getElementById('h-tab-btn-appts').classList.toggle('active', showAppts);
  document.getElementById('h-tab-btn-docs').classList.toggle('active', !showAppts);
}

/* ═══════════════════════════════════════════════════════
   DOCTOR DASHBOARD
   ═══════════════════════════════════════════════════════ */

async function loadDoctorDashboard() {
  if (!S.token || S.role !== 'doctor') return;

  const name = S.user?.name || 'Doctor';
  document.getElementById('d-sidebar-name').textContent = `Dr. ${name}`;

  const res          = await api('/api/doctor/appointments');
  const appointments = res.ok
    ? (Array.isArray(res.data) ? res.data : res.data.data || [])
    : [];

  const todayDate      = new Date().toISOString().split('T')[0];
  const todayCount     = appointments.filter(a => a.date?.startsWith(todayDate)).length;

  document.getElementById('d-total').textContent = appointments.length;
  document.getElementById('d-today').textContent = todayCount;

  const container = document.getElementById('d-appts');

  if (!appointments.length) {
    container.innerHTML = `
      <div class="empty-S">
        <div class="empty-icon">📅</div>
        <h3>No appointments yet</h3>
        <p>Patients will appear here once they book</p>
      </div>`;
    return;
  }

  container.innerHTML = appointments.map(appointment => `
    <div class="card card-p" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div class="avatar">${appointment.user?.name?.charAt(0) || 'P'}</div>
        <div style="flex:1">
          <p style="font-weight:800;font-size:16px">${appointment.user?.name || 'Patient'}</p>
          <p style="font-size:13px;color:var(--mid)">${appointment.user?.email || ''}</p>
          <div style="display:flex;gap:12px;margin-top:6px">
            <span style="font-size:13px">
              📅 ${new Date(appointment.date).toLocaleDateString('en-IN', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </span>
            <span style="font-size:13px">🕐 ${appointment.slot}</span>
          </div>
        </div>
        <span class="badge badge-${appointment.status || 'pending'}">
          ${(appointment.status || 'pending').toUpperCase()}
        </span>
      </div>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════════════════ */

async function loadAdminDashboard() {
  if (!S.token || S.role !== 'admin') return;
  await loadHospitals();
}

async function loadHospitals(filterVerified = undefined) {
  const container = document.getElementById('a-hospitals');
  container.innerHTML = `
    <div class="loading-center">
      <div class="spinner"></div>
      <span>Loading hospitals…</span>
    </div>`;

  let url = '/auth/admin/hospitals';
  if (filterVerified !== undefined) url += `?verified=${filterVerified}`;

  const res       = await api(url);
  const hospitals = res.ok
    ? (res.data.data?.hospitals || res.data.hospitals || [])
    : [];
renderAdminCharts(hospitals);
  const verifiedCount   = hospitals.filter(h =>  h.verified).length;
  const unverifiedCount = hospitals.filter(h => !h.verified).length;

  document.getElementById('a-total').textContent    = hospitals.length;
  document.getElementById('a-verified').textContent = verifiedCount;
  document.getElementById('a-pending').textContent  = unverifiedCount;

  if (!hospitals.length) {
    container.innerHTML = `
      <div class="empty-S">
        <div class="empty-icon">🏥</div>
        <h3>No hospitals found</h3>
      </div>`;
    return;
  }

  container.innerHTML = hospitals.map(hospital => {


    return `
      <div class="card card-p" style="margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <div style="width:48px;height:48px;
                      background:linear-gradient(135deg,var(--sky-light),var(--sky));
                      border-radius:14px;display:flex;align-items:center;justify-content:center;
                      font-size:22px;flex-shrink:0">🏥</div>
          <div style="flex:1">
            <p style="font-weight:800;font-size:16px">${hospital.name}</p>
            <p style="font-size:13px;color:var(--mid)">${hospital.email}</p>
            <p style="font-size:12px;color:var(--mid)">${hospital.address || ''}</p>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span class="badge ${hospital.verified ? 'badge-confirmed' : 'badge-pending'}">
              ${hospital.verified ? 'VERIFIED' : 'PENDING'}
            </span>
           <button class="btn btn-outline btn-sm" onclick="viewHospital('${hospital._id}')">
  View
</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

async function verifyHospital(hospitalId) {
  const res = await api(`/auth/admin/verify-hospital/${hospitalId}`, 'PATCH');

  if (!res.ok) {
    toast(res.data.message || 'Verification failed', 'error');
    return;
  }

  toast('Hospital verified! 🎉', 'success');
  closeHospitalModal();
loadHospitals();
}

async function viewHospital(hospitalId) {
  const res = await api(`/auth/admin/hospital/${hospitalId}`);

  if (!res.ok) {
    toast('Failed to fetch hospital', 'error');
    return;
  }

  const hospital = res.data.data?.hospital || res.data.hospital;

  document.getElementById("m-name").textContent = hospital.name;
  document.getElementById("m-email").textContent = "Email: " + hospital.email;
 const coords = hospital.location?.coordinates || [];

const lng = coords[0] || "N/A";
const lat = coords[1] || "N/A";

document.getElementById("m-address").textContent =
  "Location: Lat " + lat + ", Lng " + lng;
document.getElementById("m-booking").textContent =
  "Booking: " + hospital.bookingType;

document.getElementById("m-status").textContent =
  "Status: " + (hospital.verified ? "Verified" : "Pending");

  const btn = document.getElementById("m-verify-btn");

  if (!hospital.verified) {
    btn.style.display = "inline-block";
    btn.onclick = () => verifyHospital(hospital._id);
  } else {
    btn.style.display = "none";
  }

  document.getElementById("hospital-modal").style.display = "flex";
}

function closeHospitalModal() {
  document.getElementById("hospital-modal").style.display = "none";
}

let statusChartInstance = null;
let bookingChartInstance = null;

function renderAdminCharts(hospitals) {
  const verified = hospitals.filter(h => h.verified).length;
  const pending = hospitals.length - verified;

  const bookingTypes = {};
  hospitals.forEach(h => {
    const type = h.bookingType || "UNKNOWN";
    bookingTypes[type] = (bookingTypes[type] || 0) + 1;
  });

  // Destroy old charts if exist
  if (statusChartInstance) statusChartInstance.destroy();
  if (bookingChartInstance) bookingChartInstance.destroy();

  // Pie Chart → Status
  const ctx1 = document.getElementById('statusChart');
  statusChartInstance = new Chart(ctx1, {
    type: 'pie',
    data: {
      labels: ['Verified', 'Pending'],
      datasets: [{
        data: [verified, pending],
        backgroundColor: ['#4CAF50', '#FF9800']
      }]
    }
  });

  // Bar Chart → Booking Type
  const ctx2 = document.getElementById('bookingChart');
  bookingChartInstance = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: Object.keys(bookingTypes),
      datasets: [{
        label: 'Hospitals',
        data: Object.values(bookingTypes),
        backgroundColor: '#2196F3'
      }]
    }
  });
}