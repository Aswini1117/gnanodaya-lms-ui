let allSessions = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
  await Promise.all([loadSessions(), loadBatches(), loadInstructors()]);
});

// ── LOAD SESSIONS ─────────────────────────────────────
async function loadSessions() {
  const tb = document.getElementById('sessions-table');
  try {
    const u           = getUser();
    const instituteId = u?.instituteId || 1;
    const res         = await api.get(`/zoom/meetings/institute/${instituteId}`);
    allSessions       = res?.data || res || [];
    populateFilters(allSessions);
    updateStats(allSessions);
    renderTable(allSessions);
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load sessions</td></tr>`;
  }
}

// ── LOAD BATCHES ───────────────────────────────────────
async function loadBatches() {
  const u           = getUser();
  const instituteId = u?.instituteId || 1;
  try {
    const res  = await api.get(`/admin/batches/${instituteId}`);
    const list = res?.data || res || [];
    const sel  = document.getElementById('session-batch');
    sel.innerHTML = '<option value="">Select batch</option>' +
      list.map(b => `<option value="${b.id}">${b.batchName}</option>`).join('');
  } catch (e) {
    console.error('Failed to load batches:', e);
  }
}

// ── LOAD INSTRUCTORS ───────────────────────────────────
async function loadInstructors() {
  const u           = getUser();
  const instituteId = u?.instituteId || 1;
  const container   = document.getElementById('instructor-list');
  if (!container) return;
  try {
    const res  = await api.get(`/admin/instructors/${instituteId}`);
    const list = res?.data || res || [];
    if (!list.length) {
      container.innerHTML = '<span style="color:var(--text-muted);font-size:13px">No instructors found</span>';
      return;
    }
    container.innerHTML = list.map(i => `
      <label style="display:flex;align-items:center;gap:8px;padding:6px 12px;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:13px;background:var(--surface)">
        <input type="checkbox" value="${i.id}" name="instructor-pick" style="accent-color:var(--primary)"/>
        <span>${i.fullName}</span>
      </label>
    `).join('');
  } catch (e) {
    if (container) container.innerHTML = '<span style="color:var(--text-muted);font-size:13px">Failed to load</span>';
  }
}

// ── AUDIENCE CHANGE ────────────────────────────────────
function onTargetChange() {
  const target          = document.getElementById('session-target').value;
  const batchGroup      = document.getElementById('batch-group');
  const instructorGroup = document.getElementById('instructor-group');
  batchGroup.style.display      = (target === 'STUDENTS' || target === 'BOTH') ? 'block' : 'none';
  instructorGroup.style.display = target === 'INSTRUCTORS' ? 'block' : 'none';
}

// ── CREATE SESSION ─────────────────────────────────────
async function createSession() {
  const topic    = document.getElementById('session-topic').value.trim();
  const target   = document.getElementById('session-target').value;
  const batchId  = document.getElementById('session-batch').value;
  const dt       = document.getElementById('session-datetime').value;
  const duration = document.getElementById('session-duration').value;
  const agenda   = document.getElementById('session-agenda').value.trim();

  hideCreateAlerts();

  if (!topic)  { showCreateAlert('error', 'Topic is required.'); return; }
  if (!target) { showCreateAlert('error', 'Please select an audience.'); return; }
  if ((target === 'STUDENTS' || target === 'BOTH') && !batchId) {
    showCreateAlert('error', 'Please select a batch.'); return;
  }
  if (!dt)       { showCreateAlert('error', 'Please select a date and time.'); return; }
  if (!duration) { showCreateAlert('error', 'Please enter a duration.'); return; }

  const u = getUser();
  const body = {
    topic,
    agenda:      agenda || null,
    startTime:   dt,
    duration:    parseInt(duration),
    targetType:  target,
    instituteId: u?.instituteId || 1
  };

  if (target === 'STUDENTS' || target === 'BOTH') {
    body.batchId = parseInt(batchId);
  }

  if (target === 'INSTRUCTORS') {
    const selectedIds = [...document.querySelectorAll('input[name="instructor-pick"]:checked')]
      .map(cb => parseInt(cb.value));
    if (!selectedIds.length) {
      showCreateAlert('error', 'Please select at least one instructor.'); return;
    }
    body.invitedUserIds = selectedIds;
  }

  setCreateLoading(true);
  try {
    await api.post('/zoom/meetings', body);
    showCreateAlert('success', `Session "${topic}" scheduled successfully!`);
    clearCreateForm();
    await loadSessions();
  } catch (e) {
    showCreateAlert('error', e.message || 'Failed to schedule session.');
  } finally {
    setCreateLoading(false);
  }
}

function clearCreateForm() {
  document.getElementById('session-topic').value    = '';
  document.getElementById('session-target').value   = '';
  document.getElementById('session-batch').value    = '';
  document.getElementById('session-datetime').value = '';
  document.getElementById('session-duration').value = '';
  document.getElementById('session-agenda').value   = '';
  document.getElementById('batch-group').style.display      = 'none';
  document.getElementById('instructor-group').style.display = 'none';
  document.querySelectorAll('input[name="instructor-pick"]')
    .forEach(cb => cb.checked = false);
}

function setCreateLoading(loading) {
  const btn     = document.getElementById('create-btn');
  const txt     = document.getElementById('create-text');
  const spinner = document.getElementById('create-spinner');
  btn.disabled          = loading;
  txt.style.display     = loading ? 'none' : 'inline';
  spinner.style.display = loading ? 'inline' : 'none';
}

function showCreateAlert(type, msg) {
  const el = document.getElementById(`create-alert-${type}`);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  setTimeout(() => hideCreateAlerts(), 5000);
}

function hideCreateAlerts() {
  ['create-alert-error', 'create-alert-success'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

// ── POPULATE FILTERS ───────────────────────────────────
function populateFilters(data) {
  const instructorSel = document.getElementById('filter-instructor');
  const batchSel      = document.getElementById('filter-batch');
  const instructors   = [...new Set(data.map(s => s.instructorName).filter(Boolean))];
  const batches       = [...new Set(data.map(s => s.batchName).filter(Boolean))];
  instructorSel.innerHTML = '<option value="">All Instructors</option>' +
    instructors.map(i => `<option value="${i}">${i}</option>`).join('');
  batchSel.innerHTML = '<option value="">All Batches</option>' +
    batches.map(b => `<option value="${b}">${b}</option>`).join('');
}

// ── APPLY FILTERS ──────────────────────────────────────
function applyFilters() {
  const instructor = document.getElementById('filter-instructor').value;
  const batch      = document.getElementById('filter-batch').value;
  let filtered     = allSessions;
  if (instructor) filtered = filtered.filter(s => s.instructorName === instructor);
  if (batch)      filtered = filtered.filter(s => s.batchName === batch);
  renderTable(filtered);
}

// ── UPDATE STATS ───────────────────────────────────────
function updateStats(data) {
  document.getElementById('stat-total').textContent     = data.length;
  document.getElementById('stat-upcoming').textContent  = data.filter(s => s.status === 'SCHEDULED' || s.status === 'LIVE').length;
  document.getElementById('stat-completed').textContent = data.filter(s => s.status === 'COMPLETED').length;
  document.getElementById('stat-cancelled').textContent = data.filter(s => s.status === 'CANCELLED').length;
}

// ── RENDER TABLE ───────────────────────────────────────
function renderTable(data) {
  const tb = document.getElementById('sessions-table');
  document.getElementById('session-count').textContent = data.length;
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">No sessions found</td></tr>';
    return;
  }
  tb.innerHTML = data.map(s => `
    <tr>
      <td style="font-weight:600">${s.topic || '—'}</td>
      <td>${s.instructorName || '—'}</td>
      <td>
        ${s.batchName && s.batchName !== 'N/A' ? s.batchName : audienceLabel(s.targetType)}<br>
        <small style="color:var(--text-muted)">${s.courseName && s.courseName !== 'N/A' ? s.courseName : ''}</small>
      </td>
      <td>${formatDateTime(s.startTime)}</td>
      <td>${s.duration || 0} mins</td>
      <td>${statusBadge(s.status || 'SCHEDULED')}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${s.joinUrl && s.status !== 'CANCELLED' && s.status !== 'COMPLETED'
            ? `<a href="${s.joinUrl}" target="_blank" class="btn btn-sm btn-success">👁 Join</a>`
            : ''
          }
          ${s.status !== 'CANCELLED' && s.status !== 'COMPLETED'
            ? `<button class="btn btn-sm btn-danger" onclick="cancelSession(${s.id})">🗑 Cancel</button>`
            : `<span style="font-size:12px;color:var(--text-muted)">—</span>`
          }
        </div>
      </td>
    </tr>
  `).join('');
}

// ── CANCEL SESSION ─────────────────────────────────────
async function cancelSession(id) {
  if (!confirm('Cancel this Zoom session?')) return;
  try {
    await api.delete(`/zoom/meetings/${id}`);
    showToast('Session cancelled', 'success');
    await loadSessions();
  } catch (e) {
    showToast(e.message || 'Failed to cancel', 'error');
  }
}

// ── HELPERS ────────────────────────────────────────────
function audienceLabel(targetType) {
  const map = { STUDENTS: 'Students', INSTRUCTORS: 'Instructors', BOTH: 'Students + Instructors', STAFF: 'Staff' };
  return map[targetType] || targetType || '—';
}

function formatDateTime(startTime) {
  if (!startTime) return '—';
  try {
    if (Array.isArray(startTime)) {
      const [y, m, d, h, min] = startTime;
      const dt = new Date(y, m - 1, d, h, min);
      return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
             ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const dt = new Date(startTime);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
           ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch { return startTime; }
}

function statusBadge(status) {
  const map = { SCHEDULED: 'badge-primary', LIVE: 'badge-success', COMPLETED: 'badge-secondary', CANCELLED: 'badge-danger' };
  return `<span class="badge ${map[status] || 'badge-secondary'}">${status}</span>`;
}