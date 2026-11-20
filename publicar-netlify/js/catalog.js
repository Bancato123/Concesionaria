/**
 * Concesionaria Esteban - Concesionaria de Autos y Motos
 * catalog.js - Lógica completa del catálogo de vehículos, filtros, búsqueda y paginación
 */

const CATALOG = {
  currentFilters: {
    type: 'todos',
    brand: '',
    yearMin: '',
    yearMax: '',
    priceMin: '',
    priceMax: '',
    mileageMax: '',
    fuel: '',
    transmission: '',
    condition: '',
    status: '',
    search: '',
    sort: 'newest'
  },
  currentPage: 1,
  perPage: 12,
  allVehicles: []
};

/**
 * Inicialización principal del Catálogo
 */
async function initCatalog() {
  const gridEl = document.getElementById('vehicles-grid');
  const skeletonEl = document.getElementById('loading-skeleton');

  // 1. Mostrar esqueletos de carga si no están presentes
  if (gridEl) gridEl.innerHTML = '';
  if (skeletonEl) skeletonEl.hidden = false;

  // 2. Cargar vehículos desde Supabase (si está configurado) o desde el
  //    respaldo local. `null` significa "usar respaldo local".
  let remoteVehicles = null;
  if (typeof PUBLIC_DATA !== 'undefined' && typeof PUBLIC_DATA.getVehicles === 'function') {
    remoteVehicles = await PUBLIC_DATA.getVehicles();
  }
  CATALOG.allVehicles = Array.isArray(remoteVehicles) && remoteVehicles.length > 0
    ? remoteVehicles
    : loadVehiclesFromDB();

  // Ocultar skeletons
  if (skeletonEl) skeletonEl.hidden = true;

  // Actualizar conteo en barra de estadísticas
  updateStatsBar();

  // 3. Poblar marcas disponibles
  updateBrandOptions(CATALOG.currentFilters.type);

  // 4. Actualizar contadores de las pestañas
  updateCategoryTabCounts();

  // 5. Leer y aplicar filtros iniciales desde URL (si viene del Hero o query string)
  applyURLQueryParams();

  // 6. Renderizar primera página con los filtros aplicados
  renderCatalog();

  // 7. Configurar todos los event listeners
  setupCatalogEventListeners();
}

/**
 * Carga de vehículos con fallback seguro
 */
function loadVehiclesFromDB() {
  if (typeof DB !== 'undefined' && typeof DB.getVehicles === 'function') {
    try {
      const data = DB.getVehicles();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(vehicle => ({
          ...vehicle,
          images: Array.isArray(vehicle.images)
            ? vehicle.images.map(image => typeof image === 'string' ? image : image?.url).filter(Boolean)
            : []
        }));
      }
    } catch (e) {
      console.warn('Error al leer vehículos desde DB:', e);
    }
  }

  // Fallback si existe DEFAULT_VEHICLES global
  if (typeof DEFAULT_VEHICLES !== 'undefined' && Array.isArray(DEFAULT_VEHICLES)) {
    return DEFAULT_VEHICLES;
  }

  return [];
}

/**
 * Actualiza el número de vehículos en la barra de estadísticas
 */
function updateStatsBar() {
  const statsTotal = document.getElementById('stats-total-vehicles');
  if (statsTotal && CATALOG.allVehicles.length > 0) {
    statsTotal.textContent = `${CATALOG.allVehicles.length}+`;
  }
}

/**
 * Actualiza los contadores de cada pestaña (Todos, Autos, Motos)
 */
function updateCategoryTabCounts() {
  const total = CATALOG.allVehicles.length;
  const autos = CATALOG.allVehicles.filter(v => v.type === 'auto').length;
  const motos = CATALOG.allVehicles.filter(v => v.type === 'moto').length;

  const countTodos = document.getElementById('tab-count-todos');
  const countAutos = document.getElementById('tab-count-autos');
  const countMotos = document.getElementById('tab-count-motos');

  if (countTodos) countTodos.textContent = `(${total})`;
  if (countAutos) countAutos.textContent = `(${autos})`;
  if (countMotos) countMotos.textContent = `(${motos})`;
}

/**
 * Actualiza el select de marcas según el tipo seleccionado (auto, moto o todos)
 */
function updateBrandOptions(type) {
  const filterBrandSelect = document.getElementById('filter-brand');
  const heroBrandSelect = document.getElementById('hero-brand');

  let brands = [];

  // Obtener marcas desde constantes globales si existen
  if (type === 'auto' && typeof BRANDS_AUTO !== 'undefined' && Array.isArray(BRANDS_AUTO)) {
    brands = [...BRANDS_AUTO];
  } else if (type === 'moto' && typeof BRANDS_MOTO !== 'undefined' && Array.isArray(BRANDS_MOTO)) {
    brands = [...BRANDS_MOTO];
  } else {
    // Extraer marcas dinámicamente de allVehicles
    const filteredVehicles = type && type !== 'todos' 
      ? CATALOG.allVehicles.filter(v => v.type === type)
      : CATALOG.allVehicles;
    
    const uniqueBrands = new Set();
    filteredVehicles.forEach(v => {
      if (v.brand) uniqueBrands.add(v.brand.trim());
    });
    brands = Array.from(uniqueBrands).sort((a, b) => a.localeCompare(b));
  }

  // Si aún no hay marcas, recurrir a allVehicles
  if (brands.length === 0 && CATALOG.allVehicles.length > 0) {
    const unique = new Set(CATALOG.allVehicles.map(v => v.brand).filter(Boolean));
    brands = Array.from(unique).sort((a, b) => a.localeCompare(b));
  }

  function populateSelect(selectEl, currentSelectedValue) {
    if (!selectEl) return;
    const firstOptionText = selectEl.id === 'hero-brand' ? 'Todas las marcas' : 'Todas las marcas';
    selectEl.innerHTML = `<option value="">${firstOptionText}</option>`;
    
    brands.forEach(brand => {
      const opt = document.createElement('option');
      opt.value = brand;
      opt.textContent = brand;
      if (currentSelectedValue && currentSelectedValue.toLowerCase() === brand.toLowerCase()) {
        opt.selected = true;
      }
      selectEl.appendChild(opt);
    });
  }

  populateSelect(filterBrandSelect, CATALOG.currentFilters.brand);
  populateSelect(heroBrandSelect, CATALOG.currentFilters.brand);
}

/**
 * Extrae parámetros iniciales de la URL
 */
function applyURLQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);

  const typeParam = urlParams.get('type');
  if (typeParam && ['todos', 'auto', 'moto'].includes(typeParam.toLowerCase())) {
    CATALOG.currentFilters.type = typeParam.toLowerCase();
    setActiveTab(CATALOG.currentFilters.type);
    updateBrandOptions(CATALOG.currentFilters.type);
  }

  const brandParam = urlParams.get('brand');
  if (brandParam) {
    CATALOG.currentFilters.brand = brandParam;
    const filterBrand = document.getElementById('filter-brand');
    if (filterBrand) filterBrand.value = brandParam;
    const heroBrand = document.getElementById('hero-brand');
    if (heroBrand) heroBrand.value = brandParam;
  }

  const priceRangeParam = urlParams.get('priceRange');
  if (priceRangeParam && priceRangeParam.includes('-')) {
    const [min, max] = priceRangeParam.split('-');
    if (min) {
      CATALOG.currentFilters.priceMin = min;
      const minEl = document.getElementById('filter-price-min');
      if (minEl) minEl.value = min;
    }
    if (max) {
      CATALOG.currentFilters.priceMax = max;
      const maxEl = document.getElementById('filter-price-max');
      if (maxEl) maxEl.value = max;
    }
    const heroPrice = document.getElementById('hero-price');
    if (heroPrice) heroPrice.value = priceRangeParam;
  }

  const searchParam = urlParams.get('search');
  if (searchParam) {
    CATALOG.currentFilters.search = searchParam;
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = searchParam;
  }

  const conditionParam = urlParams.get('condition');
  if (conditionParam) {
    CATALOG.currentFilters.condition = conditionParam;
    const condEl = document.getElementById('filter-condition');
    if (condEl) condEl.value = conditionParam;
  }
}

/**
 * Configuración de todos los Event Listeners
 */
function setupCatalogEventListeners() {
  // 1. Pestañas de categoría (Todos, Autos, Motos)
  const tabButtons = document.querySelectorAll('.category-tab');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedType = btn.dataset.type || 'todos';
      if (CATALOG.currentFilters.type === selectedType) return;

      CATALOG.currentFilters.type = selectedType;
      CATALOG.currentFilters.brand = ''; // Reiniciar marca al cambiar categoría
      CATALOG.currentPage = 1;

      setActiveTab(selectedType);
      updateBrandOptions(selectedType);

      // Sincronizar select de tipo en hero
      const heroType = document.getElementById('hero-type');
      if (heroType) heroType.value = selectedType;

      // Adaptar visibilidad de filtros específicos (transmisión sólo en autos)
      toggleTypeSpecificFilters(selectedType);

      renderCatalog();
    });
  });

  // 2. Buscador en tiempo real con debounce
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');

  if (searchInput) {
    const handleSearch = (typeof debounce === 'function')
      ? debounce((e) => {
          CATALOG.currentFilters.search = e.target.value.trim();
          CATALOG.currentPage = 1;
          renderCatalog();
        }, 300)
      : (e) => {
          CATALOG.currentFilters.search = e.target.value.trim();
          CATALOG.currentPage = 1;
          renderCatalog();
        };

    searchInput.addEventListener('input', handleSearch);

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        CATALOG.currentFilters.search = '';
        CATALOG.currentPage = 1;
        renderCatalog();
        searchInput.focus();
      });
    }
  }

  // 3. Ordenamiento (Sort)
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      CATALOG.currentFilters.sort = e.target.value;
      CATALOG.currentPage = 1;
      renderCatalog();
    });
  }

  // 4. Filtros individuales (inputs y selects)
  bindFilterChange('filter-brand', 'brand');
  bindFilterChange('filter-year-min', 'yearMin');
  bindFilterChange('filter-year-max', 'yearMax');
  bindFilterChange('filter-price-min', 'priceMin');
  bindFilterChange('filter-price-max', 'priceMax');
  bindFilterChange('filter-mileage', 'mileageMax');
  bindFilterChange('filter-fuel', 'fuel');
  bindFilterChange('filter-transmission', 'transmission');
  bindFilterChange('filter-condition', 'condition');
  bindFilterChange('filter-status', 'status');

  // 5. Botón "Aplicar Filtros"
  const applyBtn = document.getElementById('apply-filters-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      CATALOG.currentPage = 1;
      closeMobileFilters();
      renderCatalog();
      scrollToCatalog();
    });
  }

  // 6. Botones de "Limpiar Filtros"
  const resetBtn = document.getElementById('reset-filters-btn');
  const emptyResetBtn = document.getElementById('empty-reset-btn');

  [resetBtn, emptyResetBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        resetAllFilters();
      });
    }
  });

  // 7. Panel móvil de filtros (Abrir / Cerrar / Overlay)
  const mobileFilterBtn = document.getElementById('mobile-filter-btn');
  const closeFiltersBtn = document.getElementById('close-filters-btn');
  const filtersOverlay = document.getElementById('filters-overlay');

  if (mobileFilterBtn) {
    mobileFilterBtn.addEventListener('click', () => {
      openMobileFilters();
    });
  }

  if (closeFiltersBtn) {
    closeFiltersBtn.addEventListener('click', () => {
      closeMobileFilters();
    });
  }

  if (filtersOverlay) {
    filtersOverlay.addEventListener('click', () => {
      closeMobileFilters();
    });
  }

  // 8. Formulario de Búsqueda del Hero
  const heroForm = document.getElementById('hero-search-form');
  if (heroForm) {
    // Sincronizar select de tipo en hero para actualizar marcas
    const heroType = document.getElementById('hero-type');
    if (heroType) {
      heroType.addEventListener('change', (e) => {
        const val = e.target.value || 'todos';
        CATALOG.currentFilters.type = val;
        setActiveTab(val);
        updateBrandOptions(val);
        toggleTypeSpecificFilters(val);
      });
    }

    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const typeVal = document.getElementById('hero-type')?.value || 'todos';
      const brandVal = document.getElementById('hero-brand')?.value || '';
      const priceVal = document.getElementById('hero-price')?.value || '';

      CATALOG.currentFilters.type = typeVal;
      CATALOG.currentFilters.brand = brandVal;

      if (priceVal && priceVal.includes('-')) {
        const [pMin, pMax] = priceVal.split('-');
        CATALOG.currentFilters.priceMin = pMin;
        CATALOG.currentFilters.priceMax = pMax;

        const fMin = document.getElementById('filter-price-min');
        const fMax = document.getElementById('filter-price-max');
        if (fMin) fMin.value = pMin;
        if (fMax) fMax.value = pMax;
      } else {
        CATALOG.currentFilters.priceMin = '';
        CATALOG.currentFilters.priceMax = '';
      }

      setActiveTab(typeVal);
      updateBrandOptions(typeVal);
      toggleTypeSpecificFilters(typeVal);

      // Sincronizar select de marca en panel de filtros
      const filterBrand = document.getElementById('filter-brand');
      if (filterBrand) filterBrand.value = brandVal;

      CATALOG.currentPage = 1;
      renderCatalog();
      scrollToCatalog();
    });
  }
}

/**
 * Vincula un campo de filtro a una propiedad de CATALOG.currentFilters
 */
function bindFilterChange(elementId, filterProp) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const eventName = el.tagName.toLowerCase() === 'input' ? 'input' : 'change';

  el.addEventListener(eventName, (e) => {
    CATALOG.currentFilters[filterProp] = e.target.value;
  });
}

/**
 * Establece la pestaña visual activa
 */
function setActiveTab(type) {
  const tabs = document.querySelectorAll('.category-tab');
  tabs.forEach(tab => {
    const isSelected = tab.dataset.type === type;
    tab.classList.toggle('category-tab--active', isSelected);
    tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
}

/**
 * Muestra u oculta filtros específicos según tipo (ej: transmisión en motos)
 */
function toggleTypeSpecificFilters(type) {
  const transGroup = document.getElementById('group-transmission');
  const fuelGroup = document.getElementById('group-fuel');

  if (transGroup) {
    transGroup.style.display = type === 'moto' ? 'none' : '';
  }
}

/**
 * Abre el panel de filtros en dispositivos móviles
 */
function openMobileFilters() {
  const panel = document.getElementById('filters-panel');
  const overlay = document.getElementById('filters-overlay');
  if (panel) panel.classList.add('active');
  if (overlay) overlay.classList.add('active');
  document.body.classList.add('overflow-hidden');
}

/**
 * Cierra el panel de filtros en dispositivos móviles
 */
function closeMobileFilters() {
  const panel = document.getElementById('filters-panel');
  const overlay = document.getElementById('filters-overlay');
  if (panel) panel.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.classList.remove('overflow-hidden');
}

/**
 * Desplaza la vista suavemente a la sección de catálogo
 */
function scrollToCatalog() {
  const catalogEl = document.getElementById('catalogo');
  if (catalogEl) {
    const headerHeight = document.getElementById('main-header')?.offsetHeight || 70;
    const targetY = catalogEl.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }
}

/**
 * Restablece todos los filtros a sus valores predeterminados
 */
function resetAllFilters() {
  CATALOG.currentFilters = {
    type: 'todos',
    brand: '',
    yearMin: '',
    yearMax: '',
    priceMin: '',
    priceMax: '',
    mileageMax: '',
    fuel: '',
    transmission: '',
    condition: '',
    status: '',
    search: '',
    sort: 'newest'
  };
  CATALOG.currentPage = 1;

  // Limpiar inputs del DOM
  const ids = [
    'filter-brand', 'filter-year-min', 'filter-year-max',
    'filter-price-min', 'filter-price-max', 'filter-mileage',
    'filter-fuel', 'filter-transmission', 'filter-condition',
    'filter-status', 'search-input', 'hero-brand', 'hero-price'
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'newest';

  const heroType = document.getElementById('hero-type');
  if (heroType) heroType.value = 'todos';

  setActiveTab('todos');
  updateBrandOptions('todos');
  toggleTypeSpecificFilters('todos');

  closeMobileFilters();
  renderCatalog();
}

/**
 * Filtra y ordena los vehículos según el estado actual
 */
function getFilteredVehicles() {
  let list = [...CATALOG.allVehicles];
  const f = CATALOG.currentFilters;

  // 1. Tipo
  if (f.type && f.type !== 'todos') {
    list = list.filter(v => (v.type || '').toLowerCase() === f.type.toLowerCase());
  }

  // 2. Marca
  if (f.brand) {
    list = list.filter(v => (v.brand || '').toLowerCase() === f.brand.toLowerCase());
  }

  // 3. Año
  if (f.yearMin) {
    list = list.filter(v => Number(v.year) >= Number(f.yearMin));
  }
  if (f.yearMax) {
    list = list.filter(v => Number(v.year) <= Number(f.yearMax));
  }

  // 4. Precio
  if (f.priceMin) {
    list = list.filter(v => Number(v.price) >= Number(f.priceMin));
  }
  if (f.priceMax) {
    list = list.filter(v => Number(v.price) <= Number(f.priceMax));
  }

  // 5. Kilometraje máx
  if (f.mileageMax) {
    list = list.filter(v => Number(v.mileage || 0) <= Number(f.mileageMax));
  }

  // 6. Combustible
  if (f.fuel) {
    list = list.filter(v => (v.fuel || '').toLowerCase() === f.fuel.toLowerCase());
  }

  // 7. Transmisión
  if (f.transmission) {
    list = list.filter(v => (v.transmission || '').toLowerCase() === f.transmission.toLowerCase());
  }

  // 8. Condición (nuevo / usado)
  if (f.condition) {
    list = list.filter(v => (v.condition || '').toLowerCase() === f.condition.toLowerCase());
  }

  // 9. Estado (disponible / reservado / vendido)
  if (f.status) {
    list = list.filter(v => (v.status || '').toLowerCase() === f.status.toLowerCase());
  }

  // 10. Búsqueda por texto (marca, modelo, descripción, color, año)
  if (f.search) {
    const q = f.search.toLowerCase();
    list = list.filter(v => {
      const brand = (v.brand || '').toLowerCase();
      const model = (v.model || '').toLowerCase();
      const desc = (v.description || '').toLowerCase();
      const color = (v.color || '').toLowerCase();
      const year = String(v.year || '');
      return brand.includes(q) || model.includes(q) || desc.includes(q) || color.includes(q) || year.includes(q);
    });
  }

  // 11. Ordenamiento
  switch (f.sort) {
    case 'price-asc':
      list.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case 'price-desc':
      list.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case 'year-asc':
      list.sort((a, b) => Number(a.year) - Number(b.year));
      break;
    case 'year-desc':
      list.sort((a, b) => Number(b.year) - Number(a.year));
      break;
    case 'newest':
    default:
      // Si tiene createdAt ordenar por fecha, sino por id descendente
      list.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return Number(b.id) - Number(a.id);
      });
      break;
  }

  return list;
}

/**
 * Renderiza el catálogo principal
 */
function renderCatalog() {
  const filteredVehicles = getFilteredVehicles();
  renderVehicles(filteredVehicles, CATALOG.currentPage);
}

/**
 * Renderiza la lista paginada de vehículos
 */
function renderVehicles(vehicles, page) {
  const grid = document.getElementById('vehicles-grid');
  const emptyState = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');
  const paginationNav = document.getElementById('pagination');

  if (!grid) return;

  const total = vehicles.length;

  if (total === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    if (paginationNav) paginationNav.innerHTML = '';
    if (resultsCount) resultsCount.textContent = '0 vehículos encontrados';
    return;
  }

  if (emptyState) emptyState.hidden = true;

  // Paginación
  const perPage = CATALOG.perPage;
  const totalPages = Math.ceil(total / perPage);
  const validPage = Math.max(1, Math.min(page, totalPages));
  CATALOG.currentPage = validPage;

  const startIndex = (validPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, total);
  const pageVehicles = vehicles.slice(startIndex, endIndex);

  // Actualizar contador de resultados
  if (resultsCount) {
    resultsCount.textContent = `Mostrando ${startIndex + 1}–${endIndex} de ${total} vehículos`;
  }

  // Generar HTML de las tarjetas
  const cardsHtml = pageVehicles.map((vehicle, idx) => {
    return createVehicleCard(vehicle, idx);
  }).join('');

  grid.innerHTML = cardsHtml;

  // Las tarjetas se crean después del observer inicial de app.js; observar
  // nuevamente el DOM evita que permanezcan con opacity: 0.
  if (typeof animateOnScroll === 'function') animateOnScroll();

  // Renderizar paginador
  renderPagination(total, validPage, perPage);

  // Ejecutar lazy loading si está disponible
  if (typeof lazyLoadImages === 'function') {
    lazyLoadImages();
  }
}

/**
 * Genera el marcado HTML para una tarjeta de vehículo
 */
function createVehicleCard(vehicle, index = 0) {
  const id = vehicle.id;
  const brand = escapeText(vehicle.brand || '');
  const model = escapeText(vehicle.model || '');
  const title = `${brand} ${model}`;
  const year = vehicle.year || 'N/D';
  const price = formatPriceLocal(vehicle.price);
  const condition = (vehicle.condition || 'usado').toLowerCase();
  const status = (vehicle.status || 'disponible').toLowerCase();
  const isSold = status === 'vendido';
  const isReserved = status === 'reservado';
  const isFeatured = !!vehicle.featured;

  // Imagen principal
  const firstImage = Array.isArray(vehicle.images) ? vehicle.images[0] : null;
  const imgSrc = (typeof firstImage === 'string' ? firstImage : firstImage?.url)
    ? (typeof firstImage === 'string' ? firstImage : firstImage.url)
    : 'img/placeholder-vehicle.svg';

  // Badges
  let badgesHtml = '';
  if (isFeatured) {
    badgesHtml += `
      <span class="vehicle-card__badge vehicle-card__badge--destacado">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        Destacado
      </span>`;
  }

  if (isSold) {
    badgesHtml += `<span class="vehicle-card__badge vehicle-card__badge--vendido">Vendido</span>`;
  } else if (isReserved) {
    badgesHtml += `<span class="vehicle-card__badge vehicle-card__badge--reservado">Reservado</span>`;
  } else {
    badgesHtml += `<span class="vehicle-card__badge vehicle-card__badge--disponible">Disponible</span>`;
  }

  if (condition === 'nuevo') {
    badgesHtml += `<span class="vehicle-card__badge vehicle-card__badge--nuevo">Nuevo (0km)</span>`;
  }

  // Especificaciones según tipo
  const isMoto = (vehicle.type || '').toLowerCase() === 'moto';
  const mileageFormatted = formatMileageLocal(vehicle.mileage);
  const displacementText = formatDisplacementLocal(vehicle.displacement);
  const specDisplacement = displacementText || mileageFormatted;

  let specFuel = vehicle.fuel || 'Nafta';
  let specTrans = vehicle.transmission || (isMoto ? 'Manual' : 'Automática');

  // Enlace WhatsApp
  let waLink = `https://wa.me/595994233136?text=${encodeURIComponent(`Holaa, me intereso el ${vehicle.brand || ''} ${vehicle.model || ''}, me podes comentar un poco mas sobre el?`)}`;
  if (typeof WHATSAPP !== 'undefined' && typeof WHATSAPP.getVehicleLink === 'function') {
    waLink = WHATSAPP.getVehicleLink(vehicle);
  }

  // Animación retrasada escalonada
  const delay = (index % 6) * 0.08;

  return `
    <article class="vehicle-card ${isSold ? 'vehicle-card--sold' : ''}" data-animate style="animation-delay: ${delay}s">
      <div class="vehicle-card__image">
        <a href="vehiculo.html?id=${id}" aria-label="Ver detalles de ${title}">
          <img 
            src="${imgSrc}" 
            data-src="${imgSrc}" 
            alt="${title} en venta en Concesionaria Esteban Coronel Oviedo" 
            class="vehicle-card__img" 
            loading="lazy" 
            onerror="this.onerror=null; this.src='img/placeholder-vehicle.svg';"
          >
        </a>
        <div class="vehicle-card__badges">
          ${badgesHtml}
        </div>
      </div>

      <div class="vehicle-card__body">
        <div class="vehicle-card__header">
          <span class="vehicle-card__category">${isMoto ? 'Moto' : 'Auto'} • ${year}</span>
          <h3 class="vehicle-card__title">
            <a href="vehiculo.html?id=${id}">${title}</a>
          </h3>
        </div>

        <div class="vehicle-card__price">${price}</div>

        <div class="vehicle-card__specs">
          <!-- Año -->
          <div class="vehicle-card__spec" title="Año de fabricación">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${year}</span>
          </div>

          <!-- Kilometraje / Cilindrada -->
          <div class="vehicle-card__spec" title="${isMoto ? 'Cilindrada / Km' : 'Kilometraje'}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9"></circle>
              <polyline points="12 7 12 12 15 15"></polyline>
            </svg>
            <span>${isMoto ? specDisplacement : mileageFormatted}</span>
          </div>

          <!-- Combustible -->
          <div class="vehicle-card__spec" title="Combustible">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 22h12"></path>
              <path d="M4 9h10"></path>
              <path d="M14 22V4a2 2 0 00-2-2H6a2 2 0 00-2 2v18"></path>
              <path d="M14 13h2a2 2 0 012 2v2a2 2 0 002 2h0a2 2 0 002-2V9.83a2 2 0 00-.59-1.42L18 5"></path>
            </svg>
            <span>${specFuel}</span>
          </div>

          <!-- Transmisión -->
          <div class="vehicle-card__spec" title="Transmisión">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
            </svg>
            <span>${specTrans}</span>
          </div>
        </div>

        <div class="vehicle-card__actions flex">
          <a href="vehiculo.html?id=${id}" class="btn btn--secondary btn--sm btn--block">Ver Detalle</a>
          <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn--whatsapp btn--sm" aria-label="Consultar por WhatsApp">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * Genera la paginación con elipses cuando hay muchas páginas
 */
function renderPagination(totalItems, currentPage, perPage) {
  const container = document.getElementById('pagination');
  if (!container) return;

  const totalPages = Math.ceil(totalItems / perPage);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  // Botón Anterior
  const prevDisabled = currentPage === 1;
  html += `
    <button class="pagination__btn pagination__btn--prev ${prevDisabled ? 'pagination__btn--disabled' : ''}" 
            ${prevDisabled ? 'disabled' : ''} 
            data-page="${currentPage - 1}" 
            aria-label="Página anterior">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
  `;

  // Cálculo de páginas a mostrar con elipsis (máx 7 botones)
  const pagesToShow = getPaginationPages(currentPage, totalPages);

  pagesToShow.forEach(p => {
    if (p === '...') {
      html += `<span class="pagination__ellipsis" aria-hidden="true">&hellip;</span>`;
    } else {
      const isActive = p === currentPage;
      html += `
        <button class="pagination__btn ${isActive ? 'pagination__btn--active' : ''}" 
                data-page="${p}" 
                ${isActive ? 'aria-current="page"' : ''} 
                aria-label="Ir a página ${p}">
          ${p}
        </button>
      `;
    }
  });

  // Botón Siguiente
  const nextDisabled = currentPage === totalPages;
  html += `
    <button class="pagination__btn pagination__btn--next ${nextDisabled ? 'pagination__btn--disabled' : ''}" 
            ${nextDisabled ? 'disabled' : ''} 
            data-page="${currentPage + 1}" 
            aria-label="Página siguiente">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  `;

  container.innerHTML = html;

  // Agregar escuchadores a los botones de página
  container.querySelectorAll('.pagination__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPage = Number(btn.dataset.page);
      if (targetPage && targetPage !== currentPage && targetPage >= 1 && targetPage <= totalPages) {
        CATALOG.currentPage = targetPage;
        renderCatalog();
        scrollToCatalog();
      }
    });
  });
}

/**
 * Calcula los números de página visibles con elipsis
 */
function getPaginationPages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

/**
 * Formateo de precio en Guaraníes con fallback
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

