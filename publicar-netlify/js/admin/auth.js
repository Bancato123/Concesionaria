/**
 * Concesionaria Esteban CONCESIONARIA - ADMIN AUTH & LAYOUT CONTROLLER
 * Handles session protection, login/logout, sidebar toggling, and global admin behaviors.
 */

(function () {
  'use strict';

  // El panel legacy (/admin/) quedó deshabilitado. Los datos ahora viven en
  // Supabase y se gestionan desde /panel-gestion-2709/.
  var LEGACY_PANEL_DISABLED = true;

  // Helper to ensure DB is initialized
  function ensureDB() {
    if (typeof DB !== 'undefined' && typeof DB.init === 'function') {
      DB.init();
    }
  }

  // Determine if current page is the login page
  function isLoginPage() {
    var path = window.location.pathname.toLowerCase();
    // Matches admin/index.html, /admin/, or /admin (when hosted at root)
    return path.endsWith('/admin/index.html') ||
           path.endsWith('/admin/') ||
           path.endsWith('/admin') ||
           path.endsWith('index.html') && (path.indexOf('admin') !== -1);
  }

  // Check login state via DB or fallback sessionStorage
  function checkAuth() {
    if (LEGACY_PANEL_DISABLED) return false;
    ensureDB();
    if (typeof DB !== 'undefined' && typeof DB.isLoggedIn === 'function') {
      return DB.isLoggedIn();
    }
    return sessionStorage.getItem('Concesionaria Kevin_admin_logged') === 'true';
  }

  // Route protection
  function enforceRouteGuard() {
    if (LEGACY_PANEL_DISABLED) {
      window.location.replace('../panel-gestion-2709/');
      return false;
    }
    var loggedIn = checkAuth();
    var onLogin = isLoginPage();

    if (!loggedIn && !onLogin) {
      // Redirect to login page
      window.location.href = 'index.html';
      return false;
    }

    if (loggedIn && onLogin) {
      // Already logged in, redirect to dashboard
      window.location.href = 'dashboard.html';
      return false;
    }

    return true;
  }

  // Global Logout function
  window.adminLogout = function () {
    ensureDB();
    if (typeof DB !== 'undefined' && typeof DB.logout === 'function') {
      DB.logout();
    } else {
      sessionStorage.removeItem('Concesionaria Kevin_admin_logged');
      sessionStorage.removeItem('admin_user');
    }
    if (typeof showToast === 'function') {
      showToast('Sesión cerrada correctamente', 'info');
    }
    setTimeout(function () {
      window.location.href = 'index.html';
    }, 200);
  };

  // Setup sidebar toggle and responsive behaviors
  function setupSidebar() {
    var sidebar = document.getElementById('admin-sidebar');
    var hamburger = document.getElementById('admin-hamburger');
    var closeBtn = document.getElementById('admin-sidebar-close');
    var overlay = document.getElementById('admin-overlay');

    if (!sidebar) return;

    function openSidebar() {
      sidebar.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
      sidebar.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (hamburger) {
      hamburger.addEventListener('click', function (e) {
        e.preventDefault();
        openSidebar();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        closeSidebar();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function () {
        closeSidebar();
      });
    }

    // Highlight active link based on current page
    var currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';
    var navLinks = document.querySelectorAll('.admin__sidebar-link');
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href) {
        var linkFile = href.split('?')[0].split('#')[0];
        if (linkFile === currentFile) {
          link.classList.add('admin__sidebar-link--active');
        } else if (currentFile === '' && linkFile === 'dashboard.html') {
          link.classList.add('admin__sidebar-link--active');
        }
      }
    });

    // Update unread inquiries badge in sidebar
    updateSidebarUnreadCount();
  }

  // Expose global updater for unread count badge
  window.updateSidebarUnreadCount = function () {
    var badge = document.getElementById('sidebar-inquiries-badge');
    if (!badge) return;

    ensureDB();
    var unread = 0;
    if (typeof DB !== 'undefined' && typeof DB.getUnreadCount === 'function') {
      unread = DB.getUnreadCount();
    }
    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : unread;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  };

  // Setup login form if present
  function setupLoginForm() {
    var form = document.getElementById('login-form');
    if (!form) return;

    var userInput = document.getElementById('login-user');
    var passInput = document.getElementById('login-pass');
    var errorBox = document.getElementById('login-error');
    var card = document.querySelector('.admin-login__card');

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var username = (userInput ? userInput.value : '').trim();
      var password = (passInput ? passInput.value : '').trim();

      if (!username || !password) {
        if (errorBox) {
          errorBox.textContent = 'Por favor completá todos los campos';
          errorBox.classList.add('is-visible');
        }
        if (card) {
          card.classList.remove('shake');
          void card.offsetWidth; // trigger reflow
          card.classList.add('shake');
        }
        return;
      }

      ensureDB();
      var success = false;
      if (typeof DB !== 'undefined' && typeof DB.login === 'function') {
        success = DB.login(username, password);
      }

      if (success) {
        if (errorBox) errorBox.classList.remove('is-visible');
        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Accediendo...';
        }
        if (typeof showToast === 'function') {
          showToast('Bienvenido al Panel de Administración', 'success');
        }
        setTimeout(function () {
          window.location.href = 'dashboard.html';
        }, 400);
      } else {
        if (errorBox) {
          errorBox.textContent = 'Usuario o contraseña incorrectos';
          errorBox.classList.add('is-visible');
        }
        if (card) {
          card.classList.remove('shake');
          void card.offsetWidth; // trigger reflow
          card.classList.add('shake');
        }
        if (passInput) {
          passInput.value = '';
          passInput.focus();
        }
      }
    });
  }

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    var allowed = enforceRouteGuard();
    if (!allowed) return;

    setupLoginForm();
    setupSidebar();
  });

})();
