let allAdmins     = [];
let allInstitutes = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('SUPER_ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Super Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await Promise.all([loadInstitutes(), loadAdmins()]);
});

// ── LOAD INSTITUTES ────────────────────────────────────
async function loadInstitutes() {
  try {
    const res     = await api.get('/super-admin/institutes');
    allInstitutes = res?.data || res || [];

    const filterSel = document.getElementById('institute-filter');
    const modalSel  = document.getElementById('admin-institute');

    const opts = allInstitutes.map(i =>
      `<option value="${i.id}">${i.name}</option>`
    ).join('');

    filterSel.innerHTML = '<option value="">All Institutes</option>' + opts;
    modalSel.innerHTML  = '<option value="">Select institute</option>' + opts;
  } catch (e) {
    console.error('Failed to load institutes:', e);
  }
}

// ── LOAD ADMINS ────────────────────────────────────────
async function loadAdmins() {
  const tb = document.getElementById('admins-table');
  try {
    const results = await Promise.all(
      allInstitutes.map(i =>
        api.get(`/super-admin/admins/${i.id}`)
          .then(res => (res?.data || res || []).map(a => ({ ...a, instituteName: i.name, instituteId: i.id })))
          .catch(() => [])
      )
    );
    allAdmins = results.flat();
    document.getElementById('admin-count').textContent = allAdmins.length;
    renderTable(allAdmins);
  } catch (e) {
    tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load: ${e.message}</td></tr>`;
  }
}

// ── RENDER TABLE ───────────────────────────────────────
function renderTable(data) {
  const tb = document.getElementById('admins-table');
  if (!data.length) {
    tb.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted)">
      <div style="font-size:32px;margin-bottom:8px">👤</div>
      No admins found. Create one using the button above.
    </td></tr>`;
    return;
  }
  tb.innerHTML = data.map(a => `
    <tr>
      <td>
        <div class="user-row">
          ${avatarEl(a.fullName, 'var(--primary)')}
          <span style="font-weight:600">${a.fullName || '—'}</span>
        </div>
      </td>
      <td>${a.phone || '—'}</td>
      <td>${a.email || '—'}</td>
      <td>${a.instituteName || '—'}</td>
      <td>${statusBadge(a.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          ${a.status === 'ACTIVE'
            ? `<button class="btn btn-sm btn-danger" onclick="deactivateAdmin(${a.id})">🚫 Deactivate</button>`
            : `<button class="btn btn-sm btn-success" onclick="activateAdmin(${a.id})">✅ Activate</button>`
          }
        </div>
      </td>
    </tr>
  `).join('');
}

// ── FILTER ─────────────────────────────────────────────
function filterAdmins() {
  const q           = document.getElementById('search-input').value.toLowerCase();
  const instituteId = document.getElementById('institute-filter').value;
  const filtered = allAdmins.filter(a => {
    const matchQ = !q || a.fullName?.toLowerCase().includes(q) || a.phone?.includes(q);
    const matchI = !instituteId || String(a.instituteId) === instituteId;
    return matchQ && matchI;
  });
  renderTable(filtered);
}

// ── OPEN / CLOSE MODAL ─────────────────────────────────
function openModal() {
  document.getElementById('admin-name').value      = '';
  document.getElementById('admin-phone').value     = '';
  document.getElementById('admin-email').value     = '';
  document.getElementById('admin-password').value  = '';
  document.getElementById('admin-institute').value = '';
  document.getElementById('admin-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('admin-modal').classList.remove('show');
}

// ── SAVE ADMIN ─────────────────────────────────────────
async function saveAdmin() {
  const fullName    = document.getElementById('admin-name').value.trim();
  const phone       = document.getElementById('admin-phone').value.trim();
  const email       = document.getElementById('admin-email').value.trim();
  const password    = document.getElementById('admin-password').value;
  const instituteId = document.getElementById('admin-institute').value;

  if (!fullName)             { showToast('Full name is required', 'warning'); return; }
  if (phone.length !== 10)   { showToast('Enter a valid 10-digit phone number', 'warning'); return; }
  if (!password || password.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }
  if (!instituteId)          { showToast('Please select an institute', 'warning'); return; }

  setSaveLoading(true);
  try {
    await api.post('/super-admin/admins', {
      fullName,
      phone,
      email:       email || null,
      password,
      role:        'ADMIN',
      instituteId: parseInt(instituteId)
    });
    showToast(`Admin "${fullName}" created. Share phone: ${phone} and their password with them.`, 'success');
    closeModal();
    await Promise.all([loadInstitutes(), loadAdmins()]);
  } catch (e) {
    showToast(e.message || 'Failed to create admin', 'error');
  } finally {
    setSaveLoading(false);
  }
}

// ── ACTIVATE / DEACTIVATE ──────────────────────────────
async function deactivateAdmin(id) {
  if (!confirm('Deactivate this admin?')) return;
  try {
    await api.put(`/admin/users/${id}/status?status=INACTIVE`);
    showToast('Admin deactivated', 'success');
    await loadAdmins();
  } catch (e) {
    showToast(e.message || 'Failed', 'error');
  }
}

async function activateAdmin(id) {
  if (!confirm('Reactivate this admin?')) return;
  try {
    await api.put(`/admin/users/${id}/status?status=ACTIVE`);
    showToast('Admin activated', 'success');
    await loadAdmins();
  } catch (e) {
    showToast(e.message || 'Failed', 'error');
  }
}

// ── HELPERS ────────────────────────────────────────────
function setSaveLoading(loading) {
  const btn = document.getElementById('save-btn');
  const txt = document.getElementById('save-text');
  btn.disabled    = loading;
  txt.textContent = loading ? 'Creating...' : 'Create Admin';
}

function statusBadge(status) {
  const map = { ACTIVE: 'badge-success', INACTIVE: 'badge-danger', PENDING: 'badge-warning' };
  return `<span class="badge ${map[status] || 'badge-secondary'}">${status || '—'}</span>`;
}