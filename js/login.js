const BASE_URL = "https://gnanodaya-lms-backend-production.up.railway.app/api";

let selectedRole = null;

function redirectByRole(role) {
  const routes = {
    SUPER_ADMIN: "super-admin/dashboard.html",
    ADMIN:       "admin/dashboard.html",
    INSTRUCTOR:  "instructor/dashboard.html",
    STUDENT:     "student/dashboard.html"
  };
  const page = routes[role?.toUpperCase()];
  if (page) window.location.href = page;
}

function selectRole(card) {
  document.querySelectorAll(".role-card")
    .forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  selectedRole = card.dataset.role;
  document.getElementById("role-error").textContent = "";
  document.getElementById("login-alert").style.display = "none";
  updateSignInBtn();
}

function updateSignInBtn() {
  const phone    = document.getElementById("phone-input").value.trim();
  const password = document.getElementById("password-input").value;
  const btn      = document.getElementById("signin-btn");
  if (selectedRole && phone.length === 10 && password.length > 0) {
    btn.classList.add("active");
  } else {
    btn.classList.remove("active");
  }
}

async function signIn() {
  clearErrors();

  const phone    = document.getElementById("phone-input").value.trim();
  const password = document.getElementById("password-input").value;

  let hasError = false;

  if (!selectedRole) {
    document.getElementById("role-error").textContent = "Please select a role";
    hasError = true;
  }
  if (phone.length !== 10) {
    document.getElementById("phone-error").textContent = "Enter valid phone number";
    hasError = true;
  }
  if (!password) {
    document.getElementById("password-error").textContent = "Password required";
    hasError = true;
  }
  if (hasError) return;

  setLoading(true);

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password, role: selectedRole })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Login failed");
    }

    const data = result.data || result;

    // ── Save all auth data to localStorage ──────────
    localStorage.setItem('lms_token',  data.token);
    localStorage.setItem('lms_role',   data.role);
    localStorage.setItem('lms_userId', data.userId || '');
    localStorage.setItem('lms_user',   JSON.stringify({
      id:          data.userId,
      name:        data.fullName,
      phone:       data.phone,
      role:        data.role,
      batchId:     data.batchId     || null,
      instituteId: data.instituteId || null
    }));

    redirectByRole(data.role);

  } catch (error) {
    showAlert(error.message || "Login failed");
  } finally {
    setLoading(false);
  }
}

function signInGoogle() {
  if (!selectedRole) {
    document.getElementById("role-error").textContent = "Please select a role";
    return;
  }
  showAlert("Google Login Coming Soon");
}

function togglePwd() {
  const input = document.getElementById("password-input");
  const eye   = document.getElementById("pwd-eye");
  if (input.type === "password") {
    input.type    = "text";
    eye.textContent = "👁";
  } else {
    input.type    = "password";
    eye.textContent = "🙈";
  }
}

function setLoading(status) {
  const btn     = document.getElementById("signin-btn");
  const text    = document.getElementById("signin-text");
  const spinner = document.getElementById("signin-spinner");
  btn.disabled        = status;
  text.style.opacity  = status ? "0" : "1";
  spinner.style.display = status ? "inline-block" : "none";
}

function showAlert(message) {
  const alert = document.getElementById("login-alert");
  alert.textContent    = message;
  alert.style.display  = "block";
}

function clearErrors() {
  document.getElementById("login-alert").style.display   = "none";
  document.getElementById("role-error").textContent      = "";
  document.getElementById("phone-error").textContent     = "";
  document.getElementById("password-error").textContent  = "";
}