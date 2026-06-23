const NAV = {
  SUPER_ADMIN: [
    { section: 'Platform', items: [
      { icon: '🏠', label: 'Dashboard',          href: '/super-admin/dashboard.html' },
      { icon: '🏛', label: 'Institutes',         href: '/super-admin/institutes.html' },
      { icon: '⚙️', label: 'System Settings',    href: '/super-admin/system-settings.html' },
      { icon: '💳', label: 'Billing',            href: '/super-admin/billing.html' },
      { icon: '🗂', label: 'Audit Logs',         href: '/super-admin/audit-logs.html' },
      { icon: '🔐', label: 'Roles & Permissions', href: '/super-admin/roles-permissions.html' },
      { icon: '🔌', label: 'Integrations',       href: '/super-admin/integrations.html' },
      { icon: '👤', label: 'Admins',             href: '/super-admin/admins.html' },
      { icon: '🎥', label: 'Live Sessions',      href: '/super-admin/live-sessions.html' },
    ]}
  ],
  ADMIN: [
    { section: 'Overview', items: [
      { icon: '🏠', label: 'Dashboard',          href: '/admin/dashboard.html' },
      { icon: '📊', label: 'Reports',            href: '/admin/reports.html' },
      { icon: '📢', label: 'Announcements',      href: '/admin/announcements.html' },
    ]},
    { section: 'Users', items: [
      { icon: '👨‍🎓', label: 'Students',          href: '/admin/students.html' },
      { icon: '👨‍🏫', label: 'Instructors',       href: '/admin/instructors.html' },
      { icon: '✅', label: 'Approvals',          href: '/admin/approvals.html' },
    ]},
    { section: 'Academics', items: [
      { icon: '📚', label: 'Courses',            href: '/admin/courses.html' },
      { icon: '🗂', label: 'Batches',            href: '/admin/batches.html' },
      { icon: '📝', label: 'Enrollments',        href: '/admin/enrollments.html' },
      { icon: '🗓', label: 'Exam Schedule',      href: '/admin/exam-schedule.html' },
      { icon: '📜', label: 'Certificates',       href: '/admin/certificates.html' },
      { icon: '💳', label: 'Fee Management',     href: '/admin/fee-management.html' },
      { icon: '🎥', label: 'Live Sessions',      href: '/admin/live-sessions.html' },
    ]}
  ],
  INSTRUCTOR: [
    { section: 'Teaching', items: [
      { icon: '🏠', label: 'Dashboard',          href: '/instructor/dashboard.html' },
      { icon: '📚', label: 'My Courses',         href: '/instructor/my-courses.html' },
      { icon: '➕', label: 'Create Course',      href: '/instructor/course-builder.html' },
      { icon: '👥', label: 'My Students',        href: '/instructor/my-students.html' },
    ]},
    { section: 'Assessments', items: [
      { icon: '📝', label: 'Assignments',        href: '/instructor/assignments.html' },
      { icon: '🧪', label: 'Quizzes',            href: '/instructor/quizzes.html' },
      { icon: '✏️', label: 'Grade Book',         href: '/instructor/grade-book.html' },
    ]},
    { section: 'More', items: [
      { icon: '🎥', label: 'Live Sessions',      href: '/instructor/live-sessions.html' },
      { icon: '💬', label: 'Discussions',        href: '/instructor/discussions.html' },
      { icon: '📢', label: 'Announcements',      href: '/instructor/announcements.html' },
    ]}
  ],
  STUDENT: [
    { section: 'Learning', items: [
      { icon: '🏠', label: 'Dashboard',          href: '/student/dashboard.html' },
      { icon: '📚', label: 'My Courses',         href: '/student/my-courses.html' },
      { icon: '🔍', label: 'Browse Courses',     href: '/student/course-browser.html' },
    ]},
    { section: 'Academics', items: [
      { icon: '📝', label: 'Assignments',        href: '/student/assignments.html' },
      { icon: '🧪', label: 'Quizzes',            href: '/student/quizzes.html' },
      { icon: '📊', label: 'My Progress',        href: '/student/progress.html' },
      { icon: '🏆', label: 'Certificates',       href: '/student/certificates.html' },
    ]},
    { section: 'More', items: [
      { icon: '💬', label: 'Discussions',        href: '/student/discussions.html' },
      { icon: '🎥', label: 'Live Sessions',      href: '/student/live-session.html' },
      { icon: '📢', label: 'Announcements',      href: '/student/announcements.html' },
      { icon: '🗓', label: 'Schedule',           href: '/student/schedule.html' },
      { icon: '💳', label: 'Fee Payment',        href: '/student/fee-payment.html' },
      { icon: '👤', label: 'Profile',            href: '/student/profile.html' },
    ]}
  ]
};

function buildSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const role   = localStorage.getItem('lms_role')?.toUpperCase();
  const user   = JSON.parse(localStorage.getItem('lms_user') || '{}');
  const config = NAV[role];
  if (!config) return;
  const cur = window.location.pathname;
  let html = `
    <div class="sidebar-brand">
      <div class="brand-icon">🎓</div>
      <span class="brand-name">LearnSphere</span>
    </div>
    <div class="sidebar-user">
      <div class="sidebar-avatar">${(user.name || 'U').charAt(0)}</div>
      <div>
        <div class="sidebar-user-name">${user.name || 'User'}</div>
        <div class="sidebar-user-role">${role?.replace('_', ' ')?.toLowerCase() || ''}</div>
      </div>
    </div>
    <nav class="sidebar-nav">`;
  config.forEach(s => {
    html += `<div class="nav-section-label">${s.section}</div>`;
    s.items.forEach(item => {
      const active = cur.includes(item.href) ? 'active' : '';
      html += `<a href="${item.href}" class="nav-item ${active}">
        <span class="nav-icon">${item.icon}</span>${item.label}
      </a>`;
    });
  });
  html += `</nav>
    <div class="sidebar-logout">
      <button class="logout-btn" onclick="logout()">🚪 Logout</button>
    </div>`;
  sidebar.innerHTML = html;
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('show');
}

document.addEventListener('DOMContentLoaded', buildSidebar);