document.addEventListener('DOMContentLoaded', async () => {
  guardPage('STUDENT');
  const u = getUser();
  if (u) {
    document.getElementById('nav-name').textContent   = u.name || 'Student';
    document.getElementById('nav-avatar').textContent = (u.name || 'S').charAt(0);
  }
  await loadCerts();
});

async function loadCerts() {
  const grid = document.getElementById('certs-grid');
  try {
    const d = await api.get('/student/certificates');
    if (!d?.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏆</div>
          <p>No certificates yet. Complete a course to earn one!</p>
        </div>`;
      return;
    }
    grid.innerHTML = d.map(c => `
      <div class="panel">
        <div class="panel-body" style="text-align:center;padding:28px">
          <div style="font-size:56px;margin-bottom:14px">🏆</div>
          <div style="font-family:'Sora',sans-serif;font-size:16px;font-weight:700;margin-bottom:6px">
            ${c.courseName || '—'}
          </div>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">
            Issued on ${formatDate(c.issuedAt)}
          </div>
          <div style="font-size:11px;font-family:monospace;color:var(--text-muted);margin-bottom:16px">
            ID: ${c.certificateId || '—'}
          </div>
          <button class="btn btn-primary btn-full"
            onclick="downloadCert(${c.id})">
            📥 Download Certificate
          </button>
        </div>
      </div>
    `).join('');
  } catch {
    grid.innerHTML = '<p style="color:var(--text-muted)">Failed to load certificates</p>';
  }
}

function downloadCert(id) {
  window.open(`http://https://gnanodaya-lms-backend-production.up.railway.app/api/student/certificates/${id}/download`, '_blank');
}