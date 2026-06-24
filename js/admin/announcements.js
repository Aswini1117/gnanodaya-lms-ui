const BASE_URL   = 'http://https://gnanodaya-lms-backend-production.up.railway.app/api';
let allAnnouncements = [];

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('lms_user') || '{}');
  document.getElementById('user-name').textContent = user.name || 'Admin';

  loadAnnouncements();
  loadBatches();

  document.getElementById('ann-target').addEventListener('change', function () {
    const batchField = document.getElementById('batch-field');
    batchField.style.display = this.value === 'BATCH' ? 'block' : 'none';
  });
});

// ── LOAD ANNOUNCEMENTS ────────────────────────────────

async function loadAnnouncements() {
  const token       = localStorage.getItem('lms_token');
  const instituteId = 1;

  try {
    const res = await fetch(`${BASE_URL}/announcements/institute/${instituteId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    allAnnouncements = data.data || [];
    document.getElementById('ann-count').textContent = allAnnouncements.length;
    renderAnnouncements(allAnnouncements);

  } catch (e) {
    document.getElementById('announcements-list').innerHTML = `
      <div class="empty-state">
        <i class="ti ti-alert-circle" aria-hidden="true"></i>
        <p>Failed to load announcements: ${e.message}</p>
      </div>`;
  }
}

// ── LOAD BATCHES ──────────────────────────────────────

async function loadBatches() {
  const token       = localStorage.getItem('lms_token');
  const instituteId = 1;

  try {
    const res = await fetch(`${BASE_URL}/batches/institute/${instituteId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.success) return;

    const select  = document.getElementById('ann-batch');
    const batches = data.data || [];

    select.innerHTML = batches.length
      ? batches.map(b => `<option value="${b.id}">${b.batchName}</option>`).join('')
      : '<option value="">No batches available</option>';

  } catch (e) {
    console.error('Failed to load batches:', e);
  }
}

// ── RENDER ANNOUNCEMENTS ──────────────────────────────

function renderAnnouncements(list) {
  const container = document.getElementById('announcements-list');

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-speakerphone" aria-hidden="true"></i>
        <p>No announcements yet. Create one using the form.</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(ann => `
    <div class="ann-card" id="ann-${ann.id}">
      <div class="ann-card-head">
        <span class="ann-card-title">${escapeHtml(ann.title)}</span>
        <div class="ann-card-actions">
          <button class="btn-delete-ann" onclick="deleteAnnouncement(${ann.id}, '${escapeHtml(ann.title)}')">
            <i class="ti ti-trash" aria-hidden="true"></i> Delete
          </button>
        </div>
      </div>
      <div class="ann-card-content">${escapeHtml(ann.content)}</div>
      <div class="ann-card-meta">
        <span class="ann-badge ${getBadgeClass(ann.targetType)}">
          ${getTargetLabel(ann.targetType)}
        </span>
        <span class="ann-date">${formatDate(ann.createdAt)}</span>
      </div>
    </div>
  `).join('');
}

// ── POST ANNOUNCEMENT ─────────────────────────────────

async function postAnnouncement() {
  clearFormErrors();

  const title   = document.getElementById('ann-title').value.trim();
  const target  = document.getElementById('ann-target').value;
  const content = document.getElementById('ann-content').value.trim();
  const batchId = document.getElementById('ann-batch').value;

  let hasError = false;

  if (!title) {
    setWrapErr('wrap-title', 'title-error', 'Title is required.');
    hasError = true;
  }
  if (!target) {
    setWrapErr('wrap-target', 'target-error', 'Please select an audience.');
    hasError = true;
  }
  if (!content) {
    setWrapErr('wrap-content', 'content-error', 'Message is required.');
    hasError = true;
  }
  if (hasError) return;

  setPostLoading(true);

  const token       = localStorage.getItem('lms_token');
  const instituteId = 1;
  const userId      = localStorage.getItem('lms_userId') || 1;

  const body = {
    title,
    content,
    targetType: target,
    institute:  { id: instituteId },
    createdBy:  { id: parseInt(userId) }
  };

  if (target === 'BATCH' && batchId) {
    body.batch = { id: parseInt(batchId) };
  }

  try {
    const res = await fetch(`${BASE_URL}/announcements`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.message);

    showFormAlert('success', `Announcement "${title}" posted successfully!`);
    clearForm();
    loadAnnouncements();

  } catch (e) {
    showFormAlert('error', 'Failed to post: ' + e.message);
  } finally {
    setPostLoading(false);
  }
}

// ── DELETE ANNOUNCEMENT ───────────────────────────────

async function deleteAnnouncement(id, title) {
  if (!confirm(`Delete announcement "${title}"?`)) return;

  const token = localStorage.getItem('lms_token');

  try {
    const res = await fetch(`${BASE_URL}/announcements/${id}`, {
      method:  'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok || !data.success) throw new Error(data.message);

    showToast('Announcement deleted.');
    loadAnnouncements();

  } catch (e) {
    showToast('Failed to delete: ' + e.message);
  }
}

// ── FILTER ────────────────────────────────────────────

function filterAnnouncements() {
  const q      = document.getElementById('search-input').value.toLowerCase();
  const target = document.getElementById('filter-target').value;

  let filtered = allAnnouncements;

  if (q) {
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
    );
  }

  if (target) {
    filtered = filtered.filter(a => a.targetType === target);
  }

  renderAnnouncements(filtered);
}

// ── HELPERS ───────────────────────────────────────────

function getBadgeClass(target) {
  const map = { ALL: 'all', STUDENTS: 'students', INSTRUCTORS: 'instructors', BATCH: 'batch' };
  return map[target] || 'all';
}

function getTargetLabel(target) {
  const map = { ALL: 'Everyone', STUDENTS: 'Students', INSTRUCTORS: 'Instructors', BATCH: 'Batch' };
  return map[target] || target;
}

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setWrapErr(wrapId, errId, msg) {
  const wrap = document.getElementById(wrapId);
  const err  = document.getElementById(errId);
  if (wrap) wrap.classList.add('error');
  if (err)  err.textContent = msg;
}

function clearWrapErr(wrapId) {
  const wrap = document.getElementById(wrapId);
  if (wrap) wrap.classList.remove('error');
}

function clearFormErrors() {
  ['wrap-title', 'wrap-target', 'wrap-content'].forEach(id => clearWrapErr(id));
  ['title-error', 'target-error', 'content-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  hideFormAlerts();
}

function showFormAlert(type, msg) {
  hideFormAlerts();
  const el = document.getElementById(`form-alert-${type}`);
  if (el) {
    el.textContent   = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }
}

function hideFormAlerts() {
  ['form-alert-error', 'form-alert-success'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function clearForm() {
  document.getElementById('ann-title').value   = '';
  document.getElementById('ann-content').value = '';
  document.getElementById('ann-target').value  = '';
  document.getElementById('batch-field').style.display = 'none';
}

function setPostLoading(loading) {
  const btn     = document.getElementById('post-btn');
  const txt     = document.getElementById('post-text');
  const spinner = document.getElementById('post-spinner');
  const arrow   = document.getElementById('post-arrow');
  btn.disabled          = loading;
  txt.textContent       = loading ? 'Posting...' : 'Post Announcement';
  spinner.style.display = loading ? 'inline-block' : 'none';
  arrow.style.display   = loading ? 'none' : 'inline';
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent   = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function logout() {
  localStorage.clear();
  window.location.href = '../login.html';
}