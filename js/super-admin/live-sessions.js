let allSessions   = [];
let staffList     = [];
let selectedInstitute = null;

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('SUPER_ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Super Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadInstitutes();
});

// ── LOAD INSTITUTES ────────────────────────────────────
async function loadInstitutes() {
  try {
    const res      = await api.get('/super-admin/institutes');
    const list     = res?.data || res || [];
    const sel      = document.getElementById('institute-select');

    if (!list.length) {
      sel.innerHTML = '<option value="">No institutes found</option>';
      return;
    }

    sel.innerHTML = '<option value="">Select institute</option>' +
      list.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
  } catch (e) {
    console.error('Failed to load institutes:', e);
  }
}

// ── ON INSTITUTE CHANGE ────────────────────────────────
async function onInstituteChange() {
  const instituteId = document.getElementById('institute-select').value;
  if (!instituteId) return;
  selectedInstitute = parseInt(instituteId);
  await Promise.all([loadSessions(), loadStaff()]);
}

// ── LOAD SESSIONS ─────────────────────────────────────
async function loadSessions() {
  const tb = document.getElementById('sessions-table');
  if (!selectedInstitute) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Select an institute above to view sessions</td></tr>';
    return;
  }
  try {
    const res   = await api.get(`/zoom/meetings/institute/${selectedInstitute}`);
    const all   = res?.data || res || [];
    allSessions = all.filter(s => s.targetType === 'STAFF');
    updateStats(allSessions);
    renderTable(allSessions);
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load sessions</td></tr>`;
  }
}

// ── LOAD STAFF ─────────────────────────────────────────
async function loadStaff() {
  const container = document.getElementById('staff-list');
  if (!selectedInstitute) return;
  try {
    const [instructorsRes, adminsRes] = await Promise.all([
      api.get(`/admin/instructors/${selectedInstitute}`),
      api.get(`/super-admin/admins/${selectedInstitute}`)
    ]);
    const instructors = (instructorsRes?.data || instructorsRes || []).map(u => ({ ...u, roleLabel: 'Instructor' }));
    const admins      = (adminsRes?.data     || adminsRes     || []).map(u => ({ ...u, roleLabel: 'Admin' }));
    staffList         = [...instructors, ...admins];

    if (!staffList.length) {
      container.innerHTML = '<span style="color:var(--text-muted);font-size:13px">No instructors or admins found for this institute</span>';
      return;
    }

    container.innerHTML = staffList.map(s => `
      <label style="display:flex;align-items:center;gap:8px;padding:6px 12px;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:13px;background:var(--surface)">
        <input type="checkbox" value="${s.id}" style="accent-color:var(--primary)"/>
        <span>${s.fullName || s.name}</span>
        <span style="font-size:11px;color:var(--text-muted)">${s.roleLabel}</span>
      </label>
    `).join('');
  } catch (e) {
    container.innerHTML = `<span style="color:var(--text-muted);font-size:13px">Failed to load staff: ${e.message}</span>`;
  }
}

// ── CREATE SESSION ─────────────────────────────────────
async function createSession() {
  const topic    = document.getElementById('session-topic').value.trim();
  const dt       = document.getElementById('session-datetime').value;
  const duration = document.getElementById('session-duration').value;
  const agenda   = document.getElementById('session-agenda').value.trim();

  const selectedIds = [...document.querySelectorAll('#staff-list input[type="checkbox"]:checked')]
    .map(cb => parseInt(cb.value));

  hideCreateAlerts();

  if (!selectedInstitute) { showCreateAlert('error', 'Please select an institute first.'); return; }
  if (!topic)              { showCreateAlert('error', 'Topic is required.'); return; }
  if (!dt)                 { showCreateAlert('error', 'Please select a date and time.'); return; }
  if (!duration)           { showCreateAlert('error', 'Please enter a duration.'); return; }
  if (!selectedIds.length) { showCreateAlert('error', 'Please select at least one staff member.'); return; }

  const body = {
    topic,
    agenda:         agenda || null,
    startTime:      dt,
    duration:       parseInt(duration),
    targetType:     'STAFF',
    invitedUserIds: selectedIds,
    instituteId:    selectedInstitute
  };

  setCreateLoading(true);
  try {
    await api.post('/zoom/meetings', body);
    showCreateAlert('success', `Session "${topic}" scheduled for ${selectedIds.length} staff member(s).`);
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
  document.getElementById('session-datetime').value = '';
  document.getElementById('session-duration').value = '';
  document.getElementById('session-agenda').value   = '';
  document.querySelectorAll('#staff-list input[type="checkbox"]')
    .forEach(cb => cb.checked = false);
}

function setCreateLoading(loading) {
  const btn     = document.getElementById('create-btn');
  const txt     = document.getElementById('create-text');
  const spinner = document.getElementById('create-spinner');
  btn.disabled          = loading;
  txt.style.display     = loading ? 'none'   : 'inline';
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
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">No staff sessions yet. Schedule one above.</td></tr>';
    return;
  }
  tb.innerHTML = data.map(s => `
    <tr>
      <td style="font-weight:600">${s.topic || '—'}</td>
      <td>${s.instructorName || '—'}</td>
      <td>
        ${s.inviteeNames?.length
          ? s.inviteeNames.slice(0, 2).join(', ') + (s.inviteeNames.length > 2 ? ` +${s.inviteeNames.length - 2} more` : '')
          : '—'
        }
      </td>
      <td>${formatDateTime(s.startTime)}</td>
      <td>${s.duration || 0} mins</td>
      <td>${statusBadge(s.status || 'SCHEDULED')}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${s.startUrl && s.status !== 'CANCELLED' && s.status !== 'COMPLETED'
            ? `<a href="${s.startUrl}" target="_blank" class="btn btn-sm btn-success">▶ Start</a>`
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

// ── CANCEL ─────────────────────────────────────────────
async function cancelSession(id) {
  if (!confirm('Cancel this session?')) return;
  try {
    await api.delete(`/zoom/meetings/${id}`);
    showToast('Session cancelled', 'success');
    await loadSessions();
  } catch (e) {
    showToast(e.message || 'Failed to cancel', 'error');
  }
}

// ── HELPERS ────────────────────────────────────────────
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