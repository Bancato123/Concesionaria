/**
 * UI helpers compartidos por el panel de gestión.
 */

import { getInquiryCounts } from './vehicles-panel.js';

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value), window.location.href);
    if (['http:', 'https:', 'data:', 'blob:'].includes(url.protocol)) {
      return escapeHtml(url.href);
    }
  } catch {
    /* URL inválida */
  }
  return '';
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function showToast(message, type = 'success', duration = 3200) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('toast--visible'), 10);
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function initSidebar() {
  const sidebar   = document.getElementById('admin-sidebar');
  const overlay   = document.getElementById('admin-overlay');
  const hamburger = document.getElementById('admin-hamburger');
  const closeBtn  = document.getElementById('admin-sidebar-close');

  if (!sidebar || !overlay) return;

  const open  = () => { sidebar.classList.add('open'); overlay.classList.add('active'); };
  const close = () => { sidebar.classList.remove('open'); overlay.classList.remove('active'); };

  if (hamburger) hamburger.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);
}

export async function refreshInquiryBadge() {
  const badge = document.getElementById('sidebar-badge');
  if (!badge) return;

  try {
    const counts = await getInquiryCounts();
    const unread = counts.nueva || 0;
    badge.textContent = String(unread);
    badge.hidden = unread === 0;
  } catch (err) {
    console.warn('[UI] No se pudieron contar las consultas:', err);
    badge.hidden = true;
  }
}

/**
 * Sincroniza el correo del usuario en el pie del sidebar.
 */
export async function renderUserEmail(user) {
  const el = document.getElementById('sidebar-user-email');
  if (el) el.textContent = user?.email || '—';
}
