const BASE_URL = 'http://https://gnanodaya-lms-backend-production.up.railway.app/api';

async function submitRegister() {
  clearErrors();

  const fullName = document.getElementById('full-name').value.trim();
  const phone    = document.getElementById('phone-input').value.trim();
  const email    = document.getElementById('email-input').value.trim();
  const password = document.getElementById('password-input').value;
  const confirm  = document.getElementById('confirm-input').value;
  const terms    = document.getElementById('terms-check').checked;

  let hasError = false;

  if (!fullName) {
    setFieldErr('name-error', 'wrap-name', 'Full name is required.');
    hasError = true;
  }
  if (!phone || phone.length !== 10) {
    setFieldErr('phone-error', 'wrap-phone', 'Enter a valid 10-digit phone number.');
    hasError = true;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldErr('email-error', 'wrap-email', 'Enter a valid email address.');
    hasError = true;
  }
  if (!password || password.length < 6) {
    setFieldErr('password-error', 'wrap-password', 'Password must be at least 6 characters.');
    hasError = true;
  }
  if (password !== confirm) {
    setFieldErr('confirm-error', 'wrap-confirm', 'Passwords do not match.');
    hasError = true;
  }
  if (!terms) {
    document.getElementById('terms-error').textContent =
      'Please agree to the Terms & Conditions.';
    hasError = true;
  }

  if (hasError) return;

  setLoading(true);

  try {
    // NOTE: endpoint corrected from '/auth/student-register' to '/auth/register'
    // to match the backend mapping in AuthController.
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        fullName,
        phone,
        email,
        password,
        confirmPassword: confirm   // required by backend's match check
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Registration failed. Please try again.');
    }

    // Backend returns data.data.status (e.g. "PENDING") for the newly created student
    const status = data.data && data.data.status ? data.data.status : 'PENDING';

    showToast({
      type: 'pending',
      icon: '⏳',
      title: 'Registration submitted',
      message: `Your account status is ${status}. An institute admin will review and activate your account before you can sign in.`
    });

    document.getElementById('register-btn').style.display = 'none';

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 4000);

  } catch (e) {
    showToast({
      type: 'error',
      icon: '⚠️',
      title: 'Registration failed',
      message: e.message || 'Something went wrong. Please try again.'
    });
  } finally {
    setLoading(false);
  }
}

/**
 * Professional toast notification.
 * type: 'success' | 'error' | 'pending'
 */
function showToast({ type = 'success', icon = '✓', title = '', message = '' }, duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body">
      <strong>${title}</strong>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toastOut');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

function setFieldErr(errId, wrapId, msg) {
  const errEl  = document.getElementById(errId);
  const wrapEl = document.getElementById(wrapId);
  if (errEl)  errEl.textContent = msg;
  if (wrapEl) wrapEl.classList.add('error');
}

function clearFieldErr(errId, wrapId) {
  const errEl  = document.getElementById(errId);
  const wrapEl = document.getElementById(wrapId);
  if (errEl)  errEl.textContent = '';
  if (wrapEl) wrapEl.classList.remove('error');
}

function clearErrors() {
  [
    ['name-error',     'wrap-name'],
    ['phone-error',    'wrap-phone'],
    ['email-error',    'wrap-email'],
    ['password-error', 'wrap-password'],
    ['confirm-error',  'wrap-confirm']
  ].forEach(([errId, wrapId]) => clearFieldErr(errId, wrapId));

  document.getElementById('terms-error').textContent = '';
}

function setLoading(loading) {
  const btn     = document.getElementById('register-btn');
  const txt     = document.getElementById('register-text');
  const spinner = document.getElementById('register-spinner');
  const arrow   = document.getElementById('register-arrow');

  btn.disabled          = loading;
  txt.textContent       = loading ? 'Creating account...' : 'Create account';
  spinner.style.display = loading ? 'inline-block' : 'none';
  arrow.style.display   = loading ? 'none' : 'inline';
}

function togglePwd(inputId, iconId) {
  const inp  = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (inp.type === 'password') {
    inp.type       = 'text';
    icon.className = 'ti ti-eye-off';
  } else {
    inp.type       = 'password';
    icon.className = 'ti ti-eye';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ['full-name', 'phone-input', 'email-input',
   'password-input', 'confirm-input'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => {
      if (e.key === 'Enter') submitRegister();
    });
  });
});