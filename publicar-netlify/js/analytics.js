/**
 * Analytics & Cookie Consent Manager
 * Concesionaria Kevin - Concesionaria de Autos y Motos
 * Coronel Oviedo, Paraguay
 */

const ANALYTICS = {
  // ============================================================
  // CONFIGURATION - Replace these values with your actual IDs
  // ============================================================
  GA_MEASUREMENT_ID: 'G-XXXXXXXXXX',  // Replace with your Google Analytics 4 Measurement ID
  GOOGLE_SITE_VERIFICATION: '',        // Pegá acá el código de Search Console (opcional)
  // Google Search Console: también podés agregar el meta tag directamente en <head>.
  
  COOKIE_KEY: 'kevin_cookie_consent',
  CONSENT_DURATION_DAYS: 365,

  /**
   * Initialize analytics and cookie consent
   */
  init() {
    this.injectSearchConsoleVerification();
    this.trackWebVitals();
    
    const consent = this.getConsent();
    
    if (consent === null) {
      // No decision yet — show banner
      this.showCookieBanner();
    } else if (consent === true) {
      // User accepted — load analytics
      this.loadGoogleAnalytics();
    }
    // If consent === false, do nothing (rejected)
  },

  /**
   * Get current cookie consent status
   * @returns {boolean|null} true=accepted, false=rejected, null=no decision
   */
  getConsent() {
    const stored = localStorage.getItem(this.COOKIE_KEY);
    if (stored === null) return null;
    try {
      const data = JSON.parse(stored);
      // Check if consent has expired
      const expiryDate = new Date(data.date);
      expiryDate.setDate(expiryDate.getDate() + this.CONSENT_DURATION_DAYS);
      if (new Date() > expiryDate) {
        localStorage.removeItem(this.COOKIE_KEY);
        return null;
      }
      return data.accepted;
    } catch {
      return null;
    }
  },

  /**
   * Save cookie consent decision
   */
  setConsent(accepted) {
    localStorage.setItem(this.COOKIE_KEY, JSON.stringify({
      accepted,
      date: new Date().toISOString()
    }));
  },

  /**
   * Show the cookie consent banner
   */
  showCookieBanner() {
    // Don't show on admin/panel pages
    if (/\/(admin|panel-gestion-2709)(\/|$)/.test(window.location.pathname)) return;
    
    // Create banner if it doesn't exist
    if (document.getElementById('cookie-banner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentimiento de cookies');
    banner.innerHTML = `
      <div class="cookie-banner__inner">
        <div class="cookie-banner__text">
          <p>Utilizamos cookies propias y de terceros para mejorar tu experiencia de navegación, 
          analizar el tráfico del sitio y personalizar contenido. Al hacer clic en "Aceptar", 
          consentís el uso de todas las cookies. Podés leer más en nuestra 
          <a href="cookies.html">Política de Cookies</a> y nuestra 
          <a href="privacidad.html">Política de Privacidad</a>.</p>
        </div>
        <div class="cookie-banner__actions">
          <button id="cookie-reject" class="cookie-banner__btn cookie-banner__btn--reject" type="button">Rechazar</button>
          <button id="cookie-accept" class="cookie-banner__btn cookie-banner__btn--accept" type="button">Aceptar</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
    
    // Show with animation after a short delay
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        banner.classList.add('visible');
      });
    });
    
    // Event listeners
    const acceptBtn = document.getElementById('cookie-accept');
    const rejectBtn = document.getElementById('cookie-reject');

    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        this.setConsent(true);
        this.hideCookieBanner();
        this.loadGoogleAnalytics();
        if (typeof showToast === 'function') {
          showToast('Preferencias de cookies guardadas', 'success');
        }
      });
    }
    
    if (rejectBtn) {
      rejectBtn.addEventListener('click', () => {
        this.setConsent(false);
        this.hideCookieBanner();
        this.removeAnalyticsCookies();
        if (typeof showToast === 'function') {
          showToast('Cookies de análisis desactivadas', 'info');
        }
      });
    }
  },

  /**
   * Hide cookie banner with animation
   */
  hideCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 400);
    }
  },

  /**
   * Load Google Analytics 4 (gtag.js)
   * Only called after user accepts cookies
   */
  loadGoogleAnalytics() {
    if (this.GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      console.info('[Concesionaria Kevin Analytics] Google Analytics no configurado. Reemplazá G-XXXXXXXXXX con tu Measurement ID.');
      return;
    }
    
    // Don't load twice
    if (document.getElementById('ga-script')) return;
    
    // Load gtag.js script
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', this.GA_MEASUREMENT_ID, {
      'anonymize_ip': true,
      'cookie_flags': 'SameSite=None;Secure',
      'send_page_view': true,
      'page_title': document.title,
      'page_location': window.location.href
    });
    
    console.info('[Concesionaria Kevin Analytics] Google Analytics cargado correctamente.');
  },

  /**
   * Track custom events in Google Analytics
   */
  trackEvent(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  },

  /**
   * Track vehicle view
   */
  trackVehicleView(vehicle) {
    if (!vehicle) return;
    this.trackEvent('view_item', {
      currency: 'PYG',
      value: vehicle.price || 0,
      items: [{
        item_id: vehicle.id,
        item_name: `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''}`.trim(),
        item_category: vehicle.type === 'auto' ? 'Autos' : 'Motos',
        item_brand: vehicle.brand || '',
        price: vehicle.price || 0
      }]
    });
  },

  /**
   * Track WhatsApp click
   */
  trackWhatsAppClick(vehicleName = null) {
    this.trackEvent('contact_whatsapp', {
      method: 'WhatsApp',
      vehicle: vehicleName || 'General'
    });
  },

  /**
   * Track form submission
   */
  trackFormSubmission(formType, vehicleName = null) {
    this.trackEvent('generate_lead', {
      form_type: formType,
      vehicle: vehicleName || 'General'
    });
  },

  /**
   * Track search/filter usage
   */
  trackSearch(searchTerm) {
    this.trackEvent('search', {
      search_term: searchTerm
    });
  },

  /**
   * Track catalog filter
   */
  trackFilter(filterType, filterValue) {
    this.trackEvent('filter_catalog', {
      filter_type: filterType,
      filter_value: filterValue
    });
  },

  /**
   * Remove analytics cookies when user rejects
   */
  removeAnalyticsCookies() {
    const cookiesToRemove = ['_ga', '_gid', '_gat', '_ga_' + this.GA_MEASUREMENT_ID.replace('G-', '')];
    cookiesToRemove.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    });
  },

  /**
   * Inject Google Search Console verification meta tag
   */
  injectSearchConsoleVerification() {
    if (!this.GOOGLE_SITE_VERIFICATION) return;
    if (document.querySelector('meta[name="google-site-verification"]')) return;

    const meta = document.createElement('meta');
    meta.name = 'google-site-verification';
    meta.content = this.GOOGLE_SITE_VERIFICATION;
    document.head.appendChild(meta);
  },

  /**
   * Track Web Vitals (Core Web Vitals performance metrics)
   */
  trackWebVitals() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      // LCP
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (!lastEntry) return;
          const lcp = lastEntry.startTime;
          console.info(`[Web Vitals] LCP: ${Math.round(lcp)}ms ${lcp < 2500 ? '✅' : lcp < 4000 ? '⚠️' : '❌'}`);
          this.trackEvent('web_vitals', { metric: 'LCP', value: Math.round(lcp) });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) { /* not supported */ }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach(entry => {
            const fid = entry.processingStart - entry.startTime;
            console.info(`[Web Vitals] FID: ${Math.round(fid)}ms ${fid < 100 ? '✅' : fid < 300 ? '⚠️' : '❌'}`);
            this.trackEvent('web_vitals', { metric: 'FID', value: Math.round(fid) });
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) { /* not supported */ }

      // CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        
        // Report CLS when page is hidden
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            console.info(`[Web Vitals] CLS: ${clsValue.toFixed(3)} ${clsValue < 0.1 ? '✅' : clsValue < 0.25 ? '⚠️' : '❌'}`);
            this.trackEvent('web_vitals', { metric: 'CLS', value: clsValue.toFixed(3) });
          }
        });
      } catch (e) { /* not supported */ }

      // TTFB (Time to First Byte)
      try {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
          const ttfb = navEntry.responseStart;
          console.info(`[Web Vitals] TTFB: ${Math.round(ttfb)}ms ${ttfb < 800 ? '✅' : ttfb < 1800 ? '⚠️' : '❌'}`);
        }
      } catch (e) { /* not supported */ }

      // FCP (First Contentful Paint)
      try {
        const fcpObserver = new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach(entry => {
            if (entry.name !== 'first-contentful-paint') return;
            console.info(`[Web Vitals] FCP: ${Math.round(entry.startTime)}ms ${entry.startTime < 1800 ? '✅' : entry.startTime < 3000 ? '⚠️' : '❌'}`);
          });
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
      } catch (e) { /* not supported */ }
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ANALYTICS.init());
} else {
  ANALYTICS.init();
}
