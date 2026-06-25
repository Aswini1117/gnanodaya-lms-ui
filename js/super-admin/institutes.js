let allInstitutes = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('SUPER_ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Super Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadInstitutes();
});

async function loadInstitutes() {
  const tb = document.getElementById('institutes-table');
  try {
    const res = await api.get('/super-admin/institutes');
    console.log('Institutes API response:', res);
    allInstitutes = res?.data || res || [];
    console.log('Institutes array:', allInstitutes);
    document.getElementById('institute-count').textContent = allInstitutes.length;
    renderTable(allInstitutes);
  } catch (e) {
    console.error('Load institutes error:', e);
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

function renderTable(data) {
  const tb = document.getElementById('institutes-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted)">No institutes found</td></tr>';
    return;
  }
  tb.innerHTML = data.map(i => `
    <tr>
      <td>
        <div class="user-row">
          ${avatarEl(i.name, 'var(--super-admin)')}
          <div>
            <div style="font-weight:600">${i.name || '—'}</div>
            <div style="font-size:11px;color:var(--text-muted)">${i.email || ''}</div>
          </div>
        </div>
      </td>
      <td>${i.adminName || '—'}</td>
      <td>${i.phone || '—'}</td>
      <td><span class="badge badge-info">${i.subscriptionPlan || '—'}</span></td>
      <td>${i.totalUsers?.toLocaleString() ?? 0}</td>
      <td>${statusBadge(i.isActive)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="editInstitute(${i.id})">✏️</button>
          <button class="btn btn-sm ${i.isActive ? 'btn-danger' : 'btn-success'}" onclick="toggleInstitute(${i.id})">
            ${i.isActive ? '⛔ Suspend' : '✅ Activate'}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterInstitutes() {
  const q      = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('status-filter').value;
  const filtered = allInstitutes.filter(i => {
    const matchQ = !q || i.name?.toLowerCase().includes(q);
    const matchS = !status ||
      (status === 'ACTIVE'   &&  i.isActive) ||
      (status === 'INACTIVE' && !i.isActive);
    return matchQ && matchS;
  });
  renderTable(filtered);
}

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Institute';
  document.getElementById('institute-id').value = '';
  document.getElementById('inst-name').value    = '';
  document.getElementById('inst-admin').value   = '';
  document.getElementById('inst-phone').value   = '';
  document.getElementById('inst-email').value   = '';
  document.getElementById('inst-plan').value    = 'TRIAL';
  document.getElementById('inst-status').value  = 'ACTIVE';
  document.getElementById('institute-modal').classList.add('show');
}

function editInstitute(id) {
  const i = allInstitutes.find(x => x.id === id);
  if (!i) return;
  document.getElementById('modal-title').textContent = 'Edit Institute';
  document.getElementById('institute-id').value = i.id;
  document.getElementById('inst-name').value    = i.name             || '';
  document.getElementById('inst-admin').value   = i.adminName        || '';
  document.getElementById('inst-phone').value   = i.phone            || '';
  document.getElementById('inst-email').value   = i.email            || '';
  document.getElementById('inst-plan').value    = i.subscriptionPlan || 'TRIAL';
  document.getElementById('inst-status').value  = i.isActive ? 'ACTIVE' : 'INACTIVE';
  document.getElementById('institute-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('institute-modal').classList.remove('show');
}

async function saveInstitute() {
  const id    = document.getElementById('institute-id').value;
  const name  = document.getElementById('inst-name').value.trim();
  const phone = document.getElementById('inst-phone').value.trim();
  const email = document.getElementById('inst-email').value.trim();

  if (!name)  { showToast('Institute name is required', 'warning'); return; }
  if (!phone) { showToast('Phone is required', 'warning'); return; }

  const body = { name, phone, email: email || null };

  try {
    if (id) {
      await api.put(`/super-admin/institutes/${id}`, body);
      showToast('Institute updated!', 'success');
    } else {
      await api.post('/super-admin/institutes', body);
      showToast('Institute added!', 'success');
    }
    closeModal();
    await loadInstitutes();
  } catch (e) {
    showToast(e.message || 'Failed', 'error');
  }
}

async function toggleInstitute(id) {
  const institute = allInstitutes.find(x => x.id === id);
  if (!institute) return;
  const action = institute.isActive ? 'suspend' : 'activate';
  if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this institute?`)) return;
  try {
    await api.put(`/super-admin/institutes/${id}/toggle`);
    showToast(`Institute ${action}d!`, 'success');
    await loadInstitutes();
  } catch (e) {
    showToast(e.message || 'Failed', 'error');
  }
}

function statusBadge(isActive) {
  return isActive
    ? '<span class="badge badge-success">Active</span>'
    : '<span class="badge badge-danger">Inactive</span>';
}