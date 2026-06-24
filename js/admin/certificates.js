let allCerts = [];

document.addEventListener('DOMContentLoaded', async () => {
  guardPage('ADMIN');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Admin';
    document.getElementById('nav-avatar').textContent = (u.name || 'A').charAt(0);
  }
  await loadCerts();
});

async function loadCerts() {
  const tb = document.getElementById('certs-table');
  try {
    const d = await api.get('/admin/certificates');
    allCerts = d || [];
    document.getElementById('cert-count').textContent = allCerts.length;
    renderTable(allCerts);
  } catch {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">Failed to load</td></tr>';
  }
}

function renderTable(data) {
  const tb = document.getElementById('certs-table');
  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted)">No certificates issued</td></tr>';
    return;
  }
  tb.innerHTML = data.map(c => `
    <tr>
      <td>
        <div class="user-row">
          ${avatarEl(c.studentName, 'var(--primary)')}
          <span style="font-weight:600">${c.studentName || '—'}</span>
        </div>
      </td>
      <td>${c.courseName || '—'}</td>
      <td>${formatDate(c.issuedAt)}</td>
      <td><span style="font-family:monospace;font-size:12px">${c.certificateId || '—'}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-primary" onclick="downloadCert(${c.id})">📥 Download</button>
          <button class="btn btn-sm btn-danger"  onclick="revokeCert(${c.id})">Revoke</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterCerts() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const filtered = allCerts.filter(c =>
    !q || c.studentName?.toLowerCase().includes(q) || c.courseName?.toLowerCase().includes(q)
  );
  renderTable(filtered);
}

function openIssueModal() {
  document.getElementById('cert-student').value = '';
  document.getElementById('cert-course').value  = '';
  document.getElementById('cert-modal').classList.add('show');
}

function closeModal() {
  document.getElementById('cert-modal').classList.remove('show');
}

async function issueCertificate() {
  const studentId = document.getElementById('cert-student').value.trim();
  const courseId  = document.getElementById('cert-course').value.trim();
  if (!studentId || !courseId) { showToast('Both fields required', 'warning'); return; }
  try {
    await api.post('/admin/certificates', { studentId, courseId });
    showToast('Certificate issued!', 'success');
    closeModal();
    loadCerts();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}

async function downloadCert(id) {
  try {
    showToast('Downloading...', 'info');
    window.open(`http://https://gnanodaya-lms-backend-production.up.railway.app/api/admin/certificates/${id}/download`, '_blank');
  } catch (e) { showToast('Download failed', 'error'); }
}

async function revokeCert(id) {
  if (!confirm('Revoke this certificate?')) return;
  try {
    await api.delete(`/admin/certificates/${id}`);
    showToast('Certificate revoked', 'warning');
    loadCerts();
  } catch (e) { showToast(e.message || 'Failed', 'error'); }
}