/**
 * Concesionaria Esteban - Concesionaria de Autos y Motos
 * app.js - Inicialización global de la aplicación
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar base de datos local
  if (typeof DB !== 'undefined' && typeof DB.init === 'function') {
    try {
      DB.init();
    } catch (e) {
      console.error('Error al inicializar DB:', e);
    }
  }

  // 2. Detectar página actual
  const currentPath = window.location.pathname.toLowerCase();
  const currentFilename = currentPath.split('/').pop();
  const isVehiclePage = currentFilename.includes('vehiculo') || Boolean(document.getElementById('vehicle-content'));
  const isCatalogPage = !isVehiclePage || Boolean(document.getElementById('catalog-grid'));

  // 3. Inicializar Header y Navegación
  initHeader(isVehiclePage);

  // 4. Renderizar botón flotante de WhatsApp
  if (typeof WHATSAPP !== 'undefined' && typeof WHATSAPP.renderFloatingButtons === 'function') {
    WHATSAPP.renderFloatingButtons();
  } else {
    renderDefaultFloatingButtons();
  }

  // 5. Carga diferida de imágenes (Lazy loading)
  if (typeof lazyLoadImages === 'function') {
    lazyLoadImages();
  }

  // 6. Animaciones al hacer scroll
  if (typeof animateOnScroll === 'function') {
    animateOnScroll();
  }

  // 7 & 8. Inicializar lógica específica según la página
  if (isCatalogPage) {
    if (typeof initCatalog === 'function') {
      initCatalog();
    }
  } else if (isVehiclePage) {
    if (typeof initVehicleDetail === 'function') {
      initVehicleDetail();
    }
  }

  // 9. Inyectar datos estructurados SEO para concesionaria
  if (typeof SEO !== 'undefined' && typeof SEO.injectAutoDealer === 'function') {
    SEO.injectAutoDealer();
  }

  // 10. Atajos de teclado globales
  initKeyboardShortcuts();

  // 11. Desplazamiento suave para enlaces de ancla
  initSmoothScroll();

  // 12. Medición básica de Web Vitals en consola
  initPerformanceMetrics();
});

/**
 * Inicialización de Header, Menú Móvil y Scroll
 */
function initHeader(isVehiclePage) {
  const header = document.getElementById('main-header');
  const menuBtn = document.getElementById('menu-btn');
  const headerNav = document.getElementById('header-nav');
  const navLinks = headerNav ? headerNav.querySelectorAll('.nav-link') : [];

  // Toggle de menú hamburguesa móvil
  if (menuBtn && headerNav) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = headerNav.classList.toggle('active');
      menuBtn.classList.toggle('active', isActive);
      menuBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });

    // Cerrar al hacer clic en cualquier enlace de navegación
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        headerNav.classList.remove('active');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Cerrar al hacer clic fuera del header
    document.addEventListener('click', (e) => {
      if (!header.contains(e.target) && headerNav.classList.contains('active')) {
        headerNav.classList.remove('active');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Efecto de scroll en header (cambia fondo y opacidad)
  let lastScrollY = window.scrollY;
  let ticking = false;

  function onScroll() {
    if (!header) return;
    const scrollY = window.scrollY;

    if (scrollY > 50) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }

    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll(); // Check inicial

  // Resaltado de navegación activa
  if (isVehiclePage) {
    const navHome = document.getElementById('nav-home');
    const navCatalog = document.getElementById('nav-catalog');
    if (navHome) navHome.classList.remove('nav-link--active');
    if (navCatalog) navCatalog.classList.add('nav-link--active');
  } else {
    // Escucha de intersección o posición de catálogo para actualizar 'nav-link--active'
    const catalogSection = document.getElementById('catalogo');
    const navHome = document.getElementById('nav-home');
    const navCatalog = document.getElementById('nav-catalog');

    if (catalogSection && navHome && navCatalog) {
      window.addEventListener('scroll', () => {
        const rect = catalogSection.getBoundingClientRect();
        if (rect.top <= 160 && rect.bottom >= 160) {
          navHome.classList.remove('nav-link--active');
          navCatalog.classList.add('nav-link--active');
        } else if (window.scrollY < 200) {
          navHome.classList.add('nav-link--active');
          navCatalog.classList.remove('nav-link--active');
        }
      }, { passive: true });
    }
  }
}

/**
 * Atajos de teclado globales
 */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      // 1. Cerrar Lightbox si está abierto
      const lightbox = document.getElementById('lightbox');
      if (lightbox && !lightbox.hidden && lightbox.classList.contains('active')) {
        const closeBtn = document.getElementById('lightbox-close');
        if (closeBtn) closeBtn.click();
        else {
          lightbox.hidden = true;
          lightbox.classList.remove('active');
        }
      }

      // 2. Cerrar panel de filtros móvil si está abierto
      const filtersPanel = document.getElementById('filters-panel');
      const filtersOverlay = document.getElementById('filters-overlay');
      if (filtersPanel && filtersPanel.classList.contains('active')) {
        filtersPanel.classList.remove('active');
        if (filtersOverlay) filtersOverlay.classList.remove('active');
        document.body.classList.remove('overflow-hidden');
      }

      // 3. Cerrar menú móvil
      const headerNav = document.getElementById('header-nav');
      const menuBtn = document.getElementById('menu-btn');
      if (headerNav && headerNav.classList.contains('active')) {
        headerNav.classList.remove('active');
        if (menuBtn) {
          menuBtn.classList.remove('active');
          menuBtn.setAttribute('aria-expanded', 'false');
        }
      }

      // 4. Cerrar opciones de compartir si están abiertas
      const shareOptions = document.getElementById('share-options');
      if (shareOptions && !shareOptions.hidden) {
        shareOptions.hidden = true;
      }
    }
  });
}

/**
 * Desplazamiento suave para enlaces ancla respetando la altura del header
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const header = document.getElementById('main-header');
        const headerHeight = header ? header.offsetHeight : 70;
        const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Actualizar URL sin saltar abruptamente
        if (history.pushState) {
          history.pushState(null, null, targetId);
        }
      }
    });
  });
}

/**
 * Fallback para renderizar botones flotantes si WHATSAPP.renderFloatingButtons no existe
 */
function renderDefaultFloatingButtons() {
  if (document.querySelector('.floating-buttons')) return;

  const container = document.createElement('div');
  container.className = 'floating-buttons';
  container.innerHTML = `
    <a href="https://wa.me/595994233136?text=Hola%20Concesionaria Esteban,%20quisiera%20consultar%20sobre%20un%20veh%C3%ADculo" 
       class="floating-btn floating-btn--whatsapp" 
       target="_blank" 
       rel="noopener noreferrer" 
       aria-label="Contactar por WhatsApp">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <span class="floating-btn__tooltip">¡Consultanos por WhatsApp!</span>
    </a>
  `;
  document.body.appendChild(container);
}

/**
 * Medición de Core Web Vitals (LCP, FID/INP, CLS)
 */
function initPerformanceMetrics() {
  if ('PerformanceObserver' in window) {
    try {
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          console.log(`[Web Vitals] LCP: ${Math.round(lastEntry.startTime)} ms`);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        console.log(`[Web Vitals] CLS: ${clsValue.toFixed(4)}`);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // PerformanceObserver parameters not fully supported on some legacy browsers
    }
  }
}
