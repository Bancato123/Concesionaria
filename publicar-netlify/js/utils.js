/**
 * Concesionaria Kevin CONCESIONARIA - CORE UTILITIES & HELPERS
 * Coronel Oviedo, Paraguay
 */

/**
 * Standard debounce to limit rate of function execution
 * @param {Function} fn
 * @param {number} [delay=300]
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Standard throttle to ensure function executes at most once per interval
 * @param {Function} fn
 * @param {number} [delay=100]
 * @returns {Function}
 */
function throttle(fn, delay = 100) {
  let lastExec = 0;
  let timer = null;
  return function (...args) {
    const now = Date.now();
    if (now - lastExec >= delay) {
      lastExec = now;
      fn.apply(this, args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => {
        lastExec = Date.now();
        fn.apply(this, args);
      }, delay - (now - lastExec));
    }
  };
}

/**
 * Formats a number to Paraguayan Guaraníes with dot thousands separators
 * Example: 145000000 -> "₲ 145.000.000"
 * @param {number|string} amount
 * @returns {string}
 */
function formatPrice(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₲ 0';
  }
  const num = Math.round(Number(amount));
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `₲ ${formatted}`;
}

/**
 * Formats kilometers with dot separator
 * Example: 15000 -> "15.000 km"
 * @param {number|string} km
 * @returns {string}
 */
function formatMileage(km) {
  if (km === null || km === undefined || isNaN(Number(km))) {
    return '0 km';
  }
  const num = Math.round(Number(km));
  if (num === 0) return '0 km (Nuevo)';
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted} km`;
}

/**
 * Formats engine displacement for motorcycles
 * @param {string|number} value
 * @returns {string}
 */
function formatDisplacement(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return /cc$/i.test(text) ? text : `${text} cc`;
}


/**
 * Formats ISO date string to DD/MM/YYYY
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

/**
 * Returns human-readable relative time in Spanish
 * Example: "Hace 2 días"
 * @param {string} isoString
 * @returns {string}
 */
function timeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Recién';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(days / 365);
  return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
}

/**
 * Generates unique random alphanumeric ID
 * @returns {string}
 */
function generateId() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * Transforms string into URL-friendly slug
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

/**
 * Truncates text with ellipsis
 * @param {string} text
 * @param {number} [maxLength=100]
 * @returns {string}
 */
function truncate(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Lazy loads images with data-src attribute using IntersectionObserver
 */
function lazyLoadImages() {
  if (typeof window === 'undefined') return;

  const images = document.querySelectorAll('img[data-src]');
  if (!images.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          img.classList.add('loaded');
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '200px 0px' });

    images.forEach(img => observer.observe(img));
  } else {
    // Fallback for older browsers
    images.forEach(img => {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
      img.classList.add('loaded');
    });
  }
}

/**
 * Inserts skeleton loader placeholders into target container
 * @param {HTMLElement|string} container
 * @param {number} [count=6]
 * @param {string} [type='card']
 */
function initSkeletons(container, count = 6, type = 'card') {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return;

  let skeletonHtml = '';

  if (type === 'card') {
    for (let i = 0; i < count; i++) {
      skeletonHtml += `
        <div class="skeleton-card skeleton-item">
          <div class="skeleton skeleton-image"></div>
          <div class="skeleton-card__body">
            <div class="skeleton skeleton-text skeleton-text--title"></div>
            <div class="skeleton skeleton-text skeleton-text--short"></div>
            <div class="skeleton skeleton-text" style="width: 90%;"></div>
            <div class="skeleton skeleton-text" style="height: 38px; margin-top: 0.5rem;"></div>
          </div>
        </div>
      `;
    }
  } else {
    for (let i = 0; i < count; i++) {
      skeletonHtml += `
        <div class="skeleton-item" style="margin-bottom: 1rem;">
          <div class="skeleton skeleton-text" style="width: 100%; height: 20px;"></div>
        </div>
      `;
    }
  }

  el.innerHTML = skeletonHtml;
}

/**
 * Removes all skeleton placeholders from target container
 * @param {HTMLElement|string} container
 */
function removeSkeletons(container) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return;
  const items = el.querySelectorAll('.skeleton-item, .skeleton-card');
  items.forEach(item => item.remove());
}

/**
 * Displays modern toast notification
 * @param {string} message
 * @param {'info'|'success'|'error'|'warning'} [type='info']
 * @param {number} [duration=3000]
 */
function showToast(message, type = 'info', duration = 3000) {
  if (typeof document === 'undefined') return;

  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const iconMap = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  toast.innerHTML = `
    <div class="toast__icon">${iconMap[type] || iconMap.info}</div>
    <div class="toast__content">${escapeHtml(message)}</div>
    <button class="toast__close" aria-label="Cerrar">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast__close');
  const dismiss = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 250);
  };

  closeBtn.addEventListener('click', dismiss);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }
}

/**
 * Smooth scrolls to target element with offset
 * @param {string|HTMLElement} selector
 * @param {number} [offset=80]
 */
function scrollToElement(selector, offset = 80) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return;
  const elementPosition = el.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

/**
 * Copies text to clipboard and triggers feedback toast
 * @param {string} text
 */
function copyToClipboard(text) {
  if (!navigator.clipboard) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Enlace copiado al portapapeles', 'success');
    } catch {
      showToast('No se pudo copiar el enlace', 'error');
    }
    document.body.removeChild(textarea);
    return;
  }

  navigator.clipboard.writeText(text)
    .then(() => {
      showToast('Enlace copiado al portapapeles', 'success');
    })
    .catch(() => {
      showToast('No se pudo copiar el enlace', 'error');
    });
}

/**
 * Gets URL query parameter value
 * @param {string} name
 * @returns {string|null}
 */
function getQueryParam(name) {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Sets or updates URL query parameter without page reload
 * @param {string} name
 * @param {string|number|null} value
 */
function setQueryParam(name, value) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location);
  if (value === null || value === undefined || value === '') {
    url.searchParams.delete(name);
  } else {
    url.searchParams.set(name, String(value));
  }
  window.history.replaceState({}, '', url);
}

/**
 * Checks if current viewport matches mobile breakpoint
 * @returns {boolean}
 */
function isMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * Observes elements with [data-animate] and adds .animate-visible when scrolled into view
 */
function animateOnScroll() {
  if (typeof window === 'undefined') return;

  const elements = document.querySelectorAll('[data-animate]');
  if (!elements.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    elements.forEach(el => observer.observe(el));
  } else {
    elements.forEach(el => el.classList.add('animate-visible'));
  }
}

/**
 * Generates WhatsApp click-to-chat URL
 * @param {string} phone
 * @param {string} message
 * @returns {string}
 */
function createWhatsAppLink(phone, message) {
  const cleanPhone = (phone || '').toString().replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(message || '');
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

/**
 * Formats raw phone number for visual display
 * Example: "595994233136" -> "+595 994 233 136"
 * @param {string} phone
 * @returns {string}
 */
function formatPhoneForDisplay(phone) {
  if (!phone) return '';
  const digits = phone.toString().replace(/\D/g, '');
  if (digits.startsWith('595') && digits.length >= 12) {
    return `+595 ${digits.substring(3, 6)} ${digits.substring(6, 9)} ${digits.substring(9)}`;
  }
  if (digits.startsWith('09') && digits.length === 10) {
    return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
  }
  return phone;
}

/**
 * Escapes unsafe HTML characters to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global browser exposure & CommonJS export
if (typeof window !== 'undefined') {
  window.debounce = debounce;
  window.throttle = throttle;
  window.formatPrice = formatPrice;
  window.formatMileage = formatMileage;
  window.formatDisplacement = formatDisplacement;
  window.formatDate = formatDate;
  window.timeAgo = timeAgo;
  window.generateId = generateId;
  window.slugify = slugify;
  window.truncate = truncate;
  window.lazyLoadImages = lazyLoadImages;
  window.initSkeletons = initSkeletons;
  window.removeSkeletons = removeSkeletons;
  window.showToast = showToast;
  window.scrollToElement = scrollToElement;
  window.copyToClipboard = copyToClipboard;
  window.getQueryParam = getQueryParam;
  window.setQueryParam = setQueryParam;
  window.isMobile = isMobile;
  window.animateOnScroll = animateOnScroll;
  window.createWhatsAppLink = createWhatsAppLink;
  window.formatPhoneForDisplay = formatPhoneForDisplay;
  window.escapeHtml = escapeHtml;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debounce,
    throttle,
    formatPrice,
    formatMileage,
    formatDisplacement,
    formatDate,
    timeAgo,
    generateId,
    slugify,
    truncate,
    lazyLoadImages,
    initSkeletons,
    removeSkeletons,
    showToast,
    scrollToElement,
    copyToClipboard,
    getQueryParam,
    setQueryParam,
    isMobile,
    animateOnScroll,
    createWhatsAppLink,
    formatPhoneForDisplay,
    escapeHtml
  };
}
