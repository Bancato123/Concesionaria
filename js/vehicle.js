/**
 * Concesionaria Esteban - Concesionaria de Autos y Motos
 * vehicle.js - Lógica completa de la página de detalle de vehículo
 */

let currentVehicle = null;
let currentGalleryImages = [];
let currentImageIndex = 0;
let currentLightboxIndex = 0;

/**
 * Inicialización de la página de detalle
 */
async function initVehicleDetail() {
  // 1. Obtener ID del vehículo desde los parámetros de la URL
  const vehicleId = getParam('id');

  if (!vehicleId) {
    showErrorState();
    return;
  }

  // 2. Cargar vehículo desde Supabase o desde el respaldo local
  currentVehicle = await loadVehicle(vehicleId);

  if (!currentVehicle) {
    showErrorState();
    return;
  }

  // 3. Ocultar estado de error si estaba visible
  const notFoundEl = document.getElementById('vehicle-not-found');
  const contentEl = document.getElementById('vehicle-content');
  if (notFoundEl) notFoundEl.hidden = true;
  if (contentEl) contentEl.hidden = false;

  // 4. Poblar datos del vehículo
  populateVehicleData(currentVehicle);

  // 5. Configurar Galería y Lightbox
  setupGallery(currentVehicle);

  // 6. Configurar Tabla de Especificaciones
  setupSpecsTable(currentVehicle);

  // 7. Configurar Botones de Acción (WhatsApp, Compartir)
  setupActionButtons(currentVehicle);

  // 8. Configurar Formulario de Consulta
  setupInquiryForm(currentVehicle);

  // 9. Cargar y renderizar Vehículos Similares
  await loadSimilarVehicles(currentVehicle);

  // 10. Actualizar Breadcrumbs y SEO
  updateSEOAndBreadcrumbs(currentVehicle);

  // 11. Carga diferida de imágenes
  if (typeof lazyLoadImages === 'function') {
    lazyLoadImages();
  }
}

/**
 * Carga de vehículo desde DB con fallback seguro
 */
async function loadVehicle(id) {
  // 1. Intentar Supabase (catálogo en línea)
  if (typeof PUBLIC_DATA !== 'undefined' && typeof PUBLIC_DATA.getVehicle === 'function') {
    try {
      const remote = await PUBLIC_DATA.getVehicle(id);
      if (remote) return remote;
      // La ficha también puede corresponder a un vehículo local aún pendiente
      // de sincronización desde el panel.
    } catch (e) {
      console.warn('Error al obtener vehículo de Supabase:', e);
    }
  }

  // 2. Respaldo local
  if (typeof DB !== 'undefined' && typeof DB.getVehicle === 'function') {
    try {
      const v = DB.getVehicle(id);
      if (v) {
        return {
          ...v,
          images: Array.isArray(v.images)
            ? v.images.map(image => typeof image === 'string' ? image : image?.url).filter(Boolean)
            : []
        };
      }
    } catch (e) {
      console.warn('Error al obtener vehículo de DB:', e);
    }
  }

  // Fallback a DEFAULT_VEHICLES
  if (typeof DEFAULT_VEHICLES !== 'undefined' && Array.isArray(DEFAULT_VEHICLES)) {
    return DEFAULT_VEHICLES.find(v => String(v.id) === String(id)) || null;
  }

  return null;
}

/**
 * Muestra el estado de vehículo no encontrado
 */
function showErrorState() {
  const notFoundEl = document.getElementById('vehicle-not-found');
  const contentEl = document.getElementById('vehicle-content');
  const specsSec = document.getElementById('specs-section');
  const descSec = document.getElementById('description-section');
  const inqSec = document.getElementById('inquiry-section');
  const simSec = document.getElementById('similar-vehicles');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');

  if (notFoundEl) notFoundEl.hidden = false;
  if (contentEl) contentEl.hidden = true;
  if (specsSec) specsSec.hidden = true;
  if (descSec) descSec.hidden = true;
  if (inqSec) inqSec.hidden = true;
  if (simSec) simSec.hidden = true;

  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = 'Vehículo no encontrado';
  }

  document.title = 'Vehículo no encontrado | Concesionaria Esteban';
}

/**
 * Llena todos los campos de texto e información del vehículo
 */
function populateVehicleData(v) {
  const isMoto = (v.type || '').toLowerCase() === 'moto';
  const brand = escapeText(v.brand || '');
  const model = escapeText(v.model || '');
  const year = v.year || '';
  const title = `${brand} ${model}`;

  // Título y subtítulo
  const titleEl = document.getElementById('vehicle-title');
  const subtitleEl = document.getElementById('vehicle-subtitle');
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = `${isMoto ? 'Moto' : 'Auto'} • ${brand} • Año ${year}`;

  // Precio
  const priceEl = document.getElementById('vehicle-price');
  if (priceEl) priceEl.textContent = formatPriceLocal(v.price);

  // Estado (Disponible / Reservado / Vendido)
  const statusEl = document.getElementById('vehicle-status');
  if (statusEl) {
    const status = (v.status || 'disponible').toLowerCase();
    statusEl.className = `badge badge--${status}`;
    statusEl.textContent = status === 'disponible' ? 'Disponible' : (status === 'reservado' ? 'Reservado' : 'Vendido');
  }

  // Condición (Nuevo / Usado)
  const conditionEl = document.getElementById('vehicle-condition');
  if (conditionEl) {
    const condition = (v.condition || 'usado').toLowerCase();
    conditionEl.hidden = condition !== 'nuevo';
    if (condition === 'nuevo') {
      conditionEl.className = 'badge badge--nuevo';
      conditionEl.textContent = 'Nuevo (0 Km)';
    }
  }

  // Badge Destacado
  const featuredBadge = document.getElementById('vehicle-featured-badge');
  if (featuredBadge) {
    featuredBadge.hidden = !v.featured;
  }

  // Descripción
  const descEl = document.getElementById('vehicle-description');
  if (descEl) {
    if (v.description && v.description.trim()) {
      // Separar por saltos de línea para generar párrafos
      const paragraphs = v.description.split('\n').filter(p => p.trim());
      descEl.innerHTML = paragraphs.map(p => `<p>${escapeText(p)}</p>`).join('');
    } else {
      descEl.innerHTML = `<p>Vehículo ${title} año ${year} en impecable estado de conservación y mantenimiento. Financiación disponible en Guaraníes a sola firma y planes flexibles.</p>`;
    }
  }
}

/**
 * Configuración de la Galería de Imágenes y Lightbox
 */
function setupGallery(v) {
  currentGalleryImages = (Array.isArray(v.images) && v.images.length > 0)
    ? v.images
    : ['img/placeholder-vehicle.svg'];

  currentImageIndex = 0;

  const mainImg = document.getElementById('gallery-main-img');
  const mainWrapper = document.getElementById('gallery-main-wrapper');
  const thumbsContainer = document.getElementById('gallery-thumbs');

  // Actualizar imagen principal
  if (mainImg) {
    mainImg.src = currentGalleryImages[0];
    mainImg.alt = `${v.brand} ${v.model} ${v.year}`;
    mainImg.onerror = function() {
      this.onerror = null;
      this.src = 'img/placeholder-vehicle.svg';
    };
  }

  // Renderizar miniaturas
  if (thumbsContainer) {
    if (currentGalleryImages.length > 1) {
      thumbsContainer.innerHTML = currentGalleryImages.map((src, idx) => `
        <button type="button" 
                class="gallery__thumb ${idx === 0 ? 'gallery__thumb--active' : ''}" 
                data-index="${idx}" 
                aria-label="Ver imagen ${idx + 1} de ${currentGalleryImages.length}">
          <img src="${src}" alt="Miniatura ${idx + 1}" loading="lazy" onerror="this.onerror=null; this.src='img/placeholder-vehicle.svg';">
        </button>
      `).join('');

      thumbsContainer.querySelectorAll('.gallery__thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
          const idx = Number(thumb.dataset.index);
          selectGalleryImage(idx);
        });
      });
    } else {
      thumbsContainer.innerHTML = '';
    }
  }

  // Clic en la imagen principal abre el Lightbox
  if (mainWrapper) {
    mainWrapper.addEventListener('click', () => {
      openLightbox(currentImageIndex);
    });

    mainWrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(currentImageIndex);
      }
    });
  }

  // Inicializar controles del Lightbox
  setupLightboxControls();
}

/**
 * Selecciona una imagen de la galería
 */
function selectGalleryImage(index) {
  if (index < 0 || index >= currentGalleryImages.length) return;
  currentImageIndex = index;

  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) {
    mainImg.src = currentGalleryImages[index];
  }

  // Actualizar clase activa en miniaturas
  const thumbs = document.querySelectorAll('.gallery__thumb');
  thumbs.forEach((thumb, idx) => {
    thumb.classList.toggle('gallery__thumb--active', idx === index);
  });
}

/**
 * Controles de Lightbox (Visor a pantalla completa)
 */
function setupLightboxControls() {
  const lightbox = document.getElementById('lightbox');
  const overlay = document.getElementById('lightbox-overlay');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (!lightbox) return;

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }
  if (overlay) {
    overlay.addEventListener('click', closeLightbox);
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => navigateLightbox(-1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => navigateLightbox(1));
  }

  // Navegación con teclado en Lightbox
  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden || !lightbox.classList.contains('active')) return;

    if (e.key === 'ArrowLeft') {
      navigateLightbox(-1);
    } else if (e.key === 'ArrowRight') {
      navigateLightbox(1);
    }
  });

  // Soporte básico para gestos táctiles (Swipe)
  let touchStartX = 0;
  let touchEndX = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        navigateLightbox(-1); // Swipe derecha -> anterior
      } else {
        navigateLightbox(1);  // Swipe izquierda -> siguiente
      }
    }
  }, { passive: true });
}

function openLightbox(index) {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  currentLightboxIndex = index;
  updateLightboxView();

  lightbox.hidden = false;
  lightbox.classList.add('active');
  document.body.classList.add('overflow-hidden');
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  lightbox.classList.remove('active');
  lightbox.hidden = true;
  document.body.classList.remove('overflow-hidden');
}

function navigateLightbox(direction) {
  if (currentGalleryImages.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex + direction + currentGalleryImages.length) % currentGalleryImages.length;
  updateLightboxView();
}

function updateLightboxView() {
  const imgEl = document.getElementById('lightbox-img');
  const counterEl = document.getElementById('lightbox-counter');

  if (imgEl && currentGalleryImages[currentLightboxIndex]) {
    imgEl.src = currentGalleryImages[currentLightboxIndex];
  }

  if (counterEl) {
    counterEl.textContent = `${currentLightboxIndex + 1} / ${currentGalleryImages.length}`;
  }
}

/**
 * Genera la tabla de especificaciones técnicas
 */
function setupSpecsTable(v) {
  const tbody = document.getElementById('specs-tbody');
  if (!tbody) return;

  const isMoto = (v.type || '').toLowerCase() === 'moto';
  const displacementText = formatDisplacementLocal(v.displacement);

  const specsList = [
    { label: 'Tipo de vehículo', value: isMoto ? 'Motocicleta' : 'Automóvil' },
    { label: 'Marca', value: v.brand },
    { label: 'Modelo', value: v.model },
    { label: 'Año', value: v.year },
    { label: 'Condición', value: (v.condition || 'usado').toLowerCase() === 'nuevo' ? 'Nuevo (0 Km)' : 'Usado' },
    { label: 'Estado comercial', value: (v.status || 'disponible').toUpperCase() },
    { label: 'Kilometraje', value: v.mileage ? formatMileageLocal(v.mileage) : (v.condition === 'nuevo' ? '0 Km' : 'N/D') },
    { label: 'Cilindrada', value: displacementText || (isMoto && v.engine ? v.engine : null) },
    { label: 'Motor', value: !isMoto ? v.engine : null },
    { label: 'Combustible', value: v.fuel },
    { label: 'Transmisión', value: v.transmission },
    { label: 'Color exterior', value: v.color },
    { label: 'Puertas', value: !isMoto && v.doors ? `${v.doors} puertas` : null },
    { label: 'Tracción', value: !isMoto ? v.traction : null },
    { label: 'Frenos', value: isMoto ? v.brakes : null },
    { label: 'Ubicación', value: 'Coronel Oviedo, Paraguay' }
  ];

  const rowsHtml = specsList
    .filter(item => item.value !== null && item.value !== undefined && String(item.value).trim() !== '')
    .map(item => `
      <tr>
        <th scope="row">${escapeText(item.label)}</th>
        <td>${escapeText(String(item.value))}</td>
      </tr>
    `).join('');

  tbody.innerHTML = rowsHtml;
}

/**
 * Configuración de Botones de Acción (WhatsApp, Compartir)
 */
function setupActionButtons(v) {
  const waBtn = document.getElementById('whatsapp-btn');
  const shareBtn = document.getElementById('share-btn');
  const shareOptions = document.getElementById('share-options');
  const shareCopy = document.getElementById('share-copy');
  const shareWa = document.getElementById('share-wa');
  const shareFb = document.getElementById('share-fb');

  const title = `${v.brand} ${v.model} (${v.year})`;
  const pageUrl = window.location.href;

  // 1. WhatsApp Button
  let waLink = `https://wa.me/595994233136?text=${encodeURIComponent(`Holaa, me intereso el ${v.brand || ''} ${v.model || ''}, me podes comentar un poco mas sobre el?`)}`;
  if (typeof WHATSAPP !== 'undefined' && typeof WHATSAPP.getVehicleLink === 'function') {
    waLink = WHATSAPP.getVehicleLink(v);
  }
  if (waBtn) waBtn.href = waLink;

  // 2. Compartir
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      // Usar Web Share API nativa si está disponible (especialmente en móviles)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `${title} | Concesionaria Esteban`,
            text: `Mirá este ${title} disponible en Concesionaria Esteban, Coronel Oviedo:`,
            url: pageUrl
          });
          return;
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.log('Fallo native share, alternando menú:', err);
          }
        }
      }

      // Si no hay Web Share API o fue cancelado, toggle menú
      if (shareOptions) {
        shareOptions.hidden = !shareOptions.hidden;
      }
    });
  }

  // Copiar Enlace
  if (shareCopy) {
    shareCopy.addEventListener('click', async () => {
      try {
        if (typeof copyToClipboard === 'function') {
          // copyToClipboard ya muestra su propio toast de confirmación.
          copyToClipboard(pageUrl);
          return;
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(pageUrl);
        } else {
          // Fallback clásico
          const tempInput = document.createElement('input');
          tempInput.value = pageUrl;
          document.body.appendChild(tempInput);
          tempInput.select();
          document.execCommand('copy');
          document.body.removeChild(tempInput);
        }

        if (typeof showToast === 'function') {
          showToast('¡Enlace copiado al portapapeles!', 'success');
        } else {
          alert('¡Enlace copiado al portapapeles!');
        }
      } catch (e) {
        console.error('Error al copiar enlace:', e);
      }
    });
  }

  // Compartir en WhatsApp
  if (shareWa) {
    shareWa.href = `https://wa.me/?text=${encodeURIComponent(`Mirá este ${title} en Concesionaria Esteban: ${pageUrl}`)}`;
  }

  // Compartir en Facebook
  if (shareFb) {
    shareFb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
  }
}

/**
 * Configuración del Formulario de Consulta
 */
function setupInquiryForm(v) {
  const form = document.getElementById('inquiry-form');
  const messageInput = document.getElementById('inquiry-message');
  const title = `${v.brand} ${v.model} (${v.year})`;

  // Pre-llenar mensaje con datos del vehículo
  if (messageInput) {
    messageInput.value = `Hola, estoy interesado/a en el ${title} (Ref: #${v.id}). Quisiera más detalles sobre precio, financiación y disponibilidad.`;
  }

  // Si existe módulo FORMS configurarlo
  if (typeof FORMS !== 'undefined' && typeof FORMS.setupContactForm === 'function') {
    FORMS.setupContactForm('inquiry-form', v.id, title);
    return;
  }

  // Fallback seguro si FORMS no está activo
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('inquiry-name');
      const phoneInput = document.getElementById('inquiry-phone');
      const emailInput = document.getElementById('inquiry-email');

      const name = nameInput?.value.trim();
      const phone = phoneInput?.value.trim();
      const email = emailInput?.value.trim() || '';
      const message = messageInput?.value.trim() || '';

      if (!name || !phone) {
        if (typeof showToast === 'function') {
          showToast('Por favor completá los campos obligatorios (*)', 'error');
        } else {
          alert('Por favor completá tu nombre y teléfono.');
        }
        return;
      }

      const inquiry = {
        vehicleId: v.id,
        vehicleName: title,
        name,
        phone,
        email,
        message,
        type: 'vehiculo'
      };

      // Guardar copia local si existe
      if (typeof DB !== 'undefined' && typeof DB.saveInquiry === 'function') {
        try { DB.saveInquiry(inquiry); } catch (err) { console.warn(err); }
      }

      // Enviar al panel (Supabase)
      if (typeof PUBLIC_DATA !== 'undefined' && typeof PUBLIC_DATA.submitInquiry === 'function' && PUBLIC_DATA.configured) {
        try {
          await PUBLIC_DATA.submitInquiry(inquiry);
        } catch (err) {
          console.error('No se pudo enviar la consulta a Supabase:', err);
          if (typeof showToast === 'function') {
            showToast('No pudimos enviar la consulta al servidor. Escribinos por WhatsApp.', 'error', 5000);
          }
          return;
        }
      }

      // Mostrar toast de éxito
      if (typeof showToast === 'function') {
        showToast('¡Gracias! Tu consulta ha sido enviada con éxito.', 'success');
      } else {
        alert('¡Gracias! Nos pondremos en contacto a la brevedad.');
      }

      // Opcional: ofrecer abrir WhatsApp para respuesta inmediata
      const submitBtn = document.getElementById('inquiry-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>✓ Consulta Enviada</span>`;
      }

      form.reset();
    });
  }
}

/**
 * Carga y renderiza vehículos similares
 */
async function loadSimilarVehicles(v) {
  const container = document.getElementById('similar-vehicles-grid');
  const section = document.getElementById('similar-vehicles');
  if (!container || !section) return;

  let similarList = [];

  // 1. Supabase
  if (typeof PUBLIC_DATA !== 'undefined' && typeof PUBLIC_DATA.getSimilar === 'function') {
    try {
      const remote = await PUBLIC_DATA.getSimilar(v, 4);
      if (Array.isArray(remote)) similarList = remote;
    } catch (e) {
      console.warn('Error al obtener vehículos similares de Supabase:', e);
    }
  }

  // 2. Respaldo local
  if ((!similarList || similarList.length === 0) && typeof DB !== 'undefined' && typeof DB.getSimilarVehicles === 'function') {
    try {
      similarList = DB.getSimilarVehicles(v, 4);
    } catch (e) {
      console.warn('Error al obtener vehículos similares:', e);
    }
  }

  // Fallback si DB no devolvió vehículos similares
  if (!similarList || similarList.length === 0) {
    const all = (typeof DEFAULT_VEHICLES !== 'undefined') ? DEFAULT_VEHICLES : [];
    similarList = all
      .filter(item => String(item.id) !== String(v.id) && item.type === v.type)
      .slice(0, 4);
  }

  if (similarList.length === 0) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

  container.innerHTML = similarList.map((simVehicle, idx) => {
    // Si catalog.js tiene createVehicleCard usarlo
    if (typeof createVehicleCard === 'function') {
      return createVehicleCard(simVehicle, idx);
    }

    // Fallback de tarjeta
    const sTitle = `${escapeText(simVehicle.brand)} ${escapeText(simVehicle.model)}`;
    const sImg = (Array.isArray(simVehicle.images) && simVehicle.images[0]) ? simVehicle.images[0] : 'img/placeholder-vehicle.svg';
    return `
      <article class="vehicle-card">
        <div class="vehicle-card__image">
          <a href="vehiculo.html?id=${simVehicle.id}">
            <img src="${sImg}" alt="${sTitle}" class="vehicle-card__img" loading="lazy">
          </a>
        </div>
        <div class="vehicle-card__body">
          <h3 class="vehicle-card__title"><a href="vehiculo.html?id=${simVehicle.id}">${sTitle}</a></h3>
          <div class="vehicle-card__price">${formatPriceLocal(simVehicle.price)}</div>
          <a href="vehiculo.html?id=${simVehicle.id}" class="btn btn--secondary btn--sm btn--block">Ver Detalle</a>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Actualiza Metadatos SEO, OpenGraph y Breadcrumbs
 */
function updateSEOAndBreadcrumbs(v) {
  const title = `${v.brand} ${v.model} ${v.year} | Concesionaria Esteban`;
  const desc = `Comprá tu ${v.brand} ${v.model} año ${v.year} en Concesionaria Esteban Coronel Oviedo. ${formatPriceLocal(v.price)}. Financiación disponible a sola firma.`;
  const image = (Array.isArray(v.images) && v.images[0]) ? v.images[0] : 'img/placeholder-vehicle.svg';

  // Título del documento
  document.title = title;

  // Breadcrumb
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  if (breadcrumbCurrent) {
    breadcrumbCurrent.textContent = `${v.brand} ${v.model}`;
  }

  // Servicios de SEO
  if (typeof SEO !== 'undefined') {
    if (typeof SEO.setMeta === 'function') {
      SEO.setMeta(title, desc);
    }
    if (typeof SEO.setOpenGraph === 'function') {
      SEO.setOpenGraph({
        title,
        description: desc,
        image,
        url: window.location.href
      });
    }
    if (typeof SEO.injectVehicle === 'function') {
      SEO.injectVehicle(v);
    }
    if (typeof SEO.injectBreadcrumbs === 'function') {
      SEO.injectBreadcrumbs([
        { name: 'Inicio', url: 'index.html' },
        { name: 'Catálogo', url: 'index.html#catalogo' },
        { name: `${v.brand} ${v.model}`, url: window.location.href }
      ]);
    }
  }
}

/**
 * Obtiene parámetro de URL seguro
 */
function getParam(name) {
  if (typeof getQueryParam === 'function') {
    return getQueryParam(name);
  }
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Formateo de precio con fallback
 */
function formatPriceLocal(amount) {
  return formatPrice(amount);
}

/**
 * Formateo de kilometraje con fallback
 */
function formatMileageLocal(km) {
  return formatMileage(km);
}

/**
 * Formateo de cilindrada evitando duplicar el sufijo "cc".
 */
function formatDisplacementLocal(value) {
  return formatDisplacement(value);
}

/**
 * Escape básico para evitar XSS
 */
function escapeText(str) {
  return escapeHtml(str);
}

