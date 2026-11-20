/**
 * Concesionaria Esteban CONCESIONARIA - DATABASE & STORAGE LAYER (localStorage)
 * Coronel Oviedo, Paraguay
 */

const DB = {
  KEYS: {
    VEHICLES: 'Concesionaria Kevin_vehicles',
    INQUIRIES: 'Concesionaria Kevin_inquiries',
    ADMIN: 'Concesionaria Kevin_admin',
    SETTINGS: 'Concesionaria Kevin_settings',
    SESSION_TOKEN: 'Concesionaria Kevin_auth_token'
  },

  _storage: {},

  /**
   * Initializes the database with default data if empty.
   * Returns this for method chaining.
   */
  init() {
    try {
      // Resolve initial vehicles
      let initialVehicles = [];
      if (typeof DEFAULT_VEHICLES !== 'undefined') {
        initialVehicles = DEFAULT_VEHICLES;
      } else if (typeof require !== 'undefined') {
        try {
          initialVehicles = require('./data.js').DEFAULT_VEHICLES || [];
        } catch {}
      }

      // Resolve initial inquiries
      let initialInquiries = [];
      if (typeof DEFAULT_INQUIRIES !== 'undefined') {
        initialInquiries = DEFAULT_INQUIRIES;
      } else if (typeof require !== 'undefined') {
        try {
          initialInquiries = require('./data.js').DEFAULT_INQUIRIES || [];
        } catch {}
      }

      // Initialize Vehicles
      let storedVehicles = this._get(this.KEYS.VEHICLES, null);
      // Remove only the fixed vehicle IDs shipped as demo catalog entries.
      // Vehicles added by the owner use generated IDs and are left untouched.
      const demoVehicleIds = new Set([
        'a001', 'a002', 'a003', 'a004', 'a005', 'a006', 'a007', 'a008',
        'm001', 'm002', 'm003', 'm004', 'm005', 'm006'
      ]);
      if (Array.isArray(storedVehicles)) {
        const ownerVehicles = storedVehicles.filter(vehicle => !demoVehicleIds.has(String(vehicle && vehicle.id)));
        if (ownerVehicles.length !== storedVehicles.length) {
          storedVehicles = ownerVehicles;
          this._set(this.KEYS.VEHICLES, storedVehicles);
        }
      }
      if (!storedVehicles || !Array.isArray(storedVehicles) || storedVehicles.length === 0) {
        this._set(this.KEYS.VEHICLES, initialVehicles);
      }

      // Initialize Inquiries
      const storedInquiries = this._get(this.KEYS.INQUIRIES, null);
      if (!storedInquiries || !Array.isArray(storedInquiries)) {
        this._set(this.KEYS.INQUIRIES, initialInquiries);
      }

      // Sembrar credenciales de administrador si no existen o si la estructura es inválida
      const storedAdmin = this._get(this.KEYS.ADMIN, null);
      if (!storedAdmin || !storedAdmin.user || !storedAdmin.passHash) {
        this._set(this.KEYS.ADMIN, {
          user: 'EstebanAutomotores',
          passHash: this._hash('Lalala123!')
        });
      }

      // Initialize Settings
      const storedSettings = this._get(this.KEYS.SETTINGS, null);
      if (!storedSettings) {
        this._set(this.KEYS.SETTINGS, {
          siteName: 'Concesionaria Esteban',
          city: 'Coronel Oviedo',
          country: 'Paraguay',
          phone: '595994233136',
          email: 'contacto@kevin.com.py',
          address: 'Ruta PY02 Km 132, Coronel Oviedo, Paraguay',
          currency: '₲'
        });
      }
    } catch (error) {
      console.error('[DB] Error initializing database:', error);
    }

    return this;
  },

  // =========================================================================
  // VEHICLES API
  // =========================================================================

  /**
   * Retrieves vehicles with flexible filtering and sorting.
   * @param {Object} [filters={}]
   * @returns {Array} Filtered list of vehicles
   */
  getVehicles(filters = {}) {
    let list = this._get(this.KEYS.VEHICLES, []);

    if (!filters || Object.keys(filters).length === 0) {
      return list;
    }

    // Type filter ('auto' | 'moto')
    if (filters.type && filters.type !== 'todos') {
      list = list.filter(v => v.type.toLowerCase() === filters.type.toLowerCase());
    }

    // Brand filter
    if (filters.brand && filters.brand !== 'todas') {
      list = list.filter(v => v.brand.toLowerCase() === filters.brand.toLowerCase());
    }

    // Model filter
    if (filters.model) {
      const q = filters.model.toLowerCase();
      list = list.filter(v => v.model.toLowerCase().includes(q));
    }

    // Year range
    if (filters.yearMin !== undefined && filters.yearMin !== null && filters.yearMin !== '') {
      const min = Number(filters.yearMin);
      if (!isNaN(min)) list = list.filter(v => v.year >= min);
    }
    if (filters.yearMax !== undefined && filters.yearMax !== null && filters.yearMax !== '') {
      const max = Number(filters.yearMax);
      if (!isNaN(max)) list = list.filter(v => v.year <= max);
    }

    // Price range
    if (filters.priceMin !== undefined && filters.priceMin !== null && filters.priceMin !== '') {
      const min = Number(filters.priceMin);
      if (!isNaN(min)) list = list.filter(v => v.price >= min);
    }
    if (filters.priceMax !== undefined && filters.priceMax !== null && filters.priceMax !== '') {
      const max = Number(filters.priceMax);
      if (!isNaN(max)) list = list.filter(v => v.price <= max);
    }

    // Mileage max
    if (filters.mileageMax !== undefined && filters.mileageMax !== null && filters.mileageMax !== '') {
      const max = Number(filters.mileageMax);
      if (!isNaN(max)) list = list.filter(v => v.mileage <= max);
    }

    // Fuel filter
    if (filters.fuel && filters.fuel !== 'todos') {
      list = list.filter(v => v.fuel && v.fuel.toLowerCase() === filters.fuel.toLowerCase());
    }

    // Transmission filter
    if (filters.transmission && filters.transmission !== 'todas') {
      list = list.filter(v => v.transmission && v.transmission.toLowerCase() === filters.transmission.toLowerCase());
    }

    // Condition filter ('nuevo' | 'usado')
    if (filters.condition && filters.condition !== 'todos') {
      list = list.filter(v => v.condition.toLowerCase() === filters.condition.toLowerCase());
    }

    // Status filter ('disponible' | 'reservado' | 'vendido')
    if (filters.status && filters.status !== 'todos') {
      list = list.filter(v => v.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Full text search
    if (filters.search && typeof filters.search === 'string') {
      const terms = filters.search.toLowerCase().trim().split(/\s+/);
      list = list.filter(v => {
        const targetString = [
          v.brand,
          v.model,
          v.year,
          v.color,
          v.engine,
          v.fuel,
          v.description
        ].filter(Boolean).join(' ').toLowerCase();

        return terms.every(term => targetString.includes(term));
      });
    }

    // Sorting
    if (filters.sort) {
      switch (filters.sort) {
        case 'price-asc':
          list.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          list.sort((a, b) => b.price - a.price);
          break;
        case 'year-desc':
          list.sort((a, b) => b.year - a.year);
          break;
        case 'year-asc':
          list.sort((a, b) => a.year - b.year);
          break;
        case 'mileage-asc':
          list.sort((a, b) => a.mileage - b.mileage);
          break;
        case 'newest':
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'oldest':
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        default:
          break;
      }
    }

    return list;
  },

  /**
   * Retrieves single vehicle by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getVehicle(id) {
    if (!id) return null;
    const list = this._get(this.KEYS.VEHICLES, []);
    return list.find(v => String(v.id) === String(id)) || null;
  },

  /**
   * Returns vehicles with featured === true and status === 'disponible'
   * @returns {Array}
   */
  getFeaturedVehicles() {
    const list = this._get(this.KEYS.VEHICLES, []);
    return list.filter(v => v.featured === true && v.status === 'disponible');
  },

  /**
   * Returns similar vehicles by type/brand excluding current vehicle
   * @param {Object} vehicle
   * @param {number} [limit=4]
   * @returns {Array}
   */
  getSimilarVehicles(vehicle, limit = 4) {
    if (!vehicle || !vehicle.id) return [];
    const list = this._get(this.KEYS.VEHICLES, []);

    // Filter out current vehicle
    const candidates = list.filter(v => String(v.id) !== String(vehicle.id));

    // Sort: same type & brand first, then same type
    candidates.sort((a, b) => {
      const aBrandMatch = a.brand.toLowerCase() === vehicle.brand.toLowerCase();
      const bBrandMatch = b.brand.toLowerCase() === vehicle.brand.toLowerCase();
      const aTypeMatch = a.type === vehicle.type;
      const bTypeMatch = b.type === vehicle.type;

      if (aTypeMatch && aBrandMatch && !(bTypeMatch && bBrandMatch)) return -1;
      if (!(aTypeMatch && aBrandMatch) && bTypeMatch && bBrandMatch) return 1;
      if (aTypeMatch && !bTypeMatch) return -1;
      if (!aTypeMatch && bTypeMatch) return 1;
      return 0;
    });

    return candidates.slice(0, limit);
  },

  /**
   * Creates or updates a vehicle
   * @param {Object} vehicle
   * @returns {Object} Saved vehicle
   */
  saveVehicle(vehicle) {
    if (!vehicle) throw new Error('Vehicle data is required');
    const list = this._get(this.KEYS.VEHICLES, []);
    const copy = { ...vehicle };

    if (copy.id) {
      const index = list.findIndex(v => String(v.id) === String(copy.id));
      if (index !== -1) {
        list[index] = {
          ...list[index],
          ...copy,
          updatedAt: new Date().toISOString()
        };
        this._set(this.KEYS.VEHICLES, list);
        return list[index];
      }
    }

    // New Vehicle
    copy.id = copy.id || this._generateId();
    copy.createdAt = copy.createdAt || new Date().toISOString();
    copy.status = copy.status || 'disponible';
    copy.featured = Boolean(copy.featured);
    copy.images = Array.isArray(copy.images) && copy.images.length ? copy.images : [
      `https://placehold.co/800x600/1B2D4A/FF6B00?text=${encodeURIComponent(copy.brand + ' ' + copy.model)}&font=raleway`
    ];

    list.unshift(copy);
    this._set(this.KEYS.VEHICLES, list);
    return copy;
  },

  /**
   * Removes a vehicle by ID
   * @param {string} id
   * @returns {boolean}
   */
  deleteVehicle(id) {
    if (!id) return false;
    const list = this._get(this.KEYS.VEHICLES, []);
    const filtered = list.filter(v => String(v.id) !== String(id));
    if (filtered.length !== list.length) {
      this._set(this.KEYS.VEHICLES, filtered);
      return true;
    }
    return false;
  },

  /**
   * Updates only the status of a vehicle
   * @param {string} id
   * @param {'disponible'|'reservado'|'vendido'} status
   * @returns {Object|null}
   */
  updateVehicleStatus(id, status) {
    const list = this._get(this.KEYS.VEHICLES, []);
    const vehicle = list.find(v => String(v.id) === String(id));
    if (vehicle) {
      vehicle.status = status;
      vehicle.updatedAt = new Date().toISOString();
      this._set(this.KEYS.VEHICLES, list);
      return vehicle;
    }
    return null;
  },

  /**
   * Toggles featured boolean on vehicle
   * @param {string} id
   * @returns {boolean|null}
   */
  toggleFeatured(id) {
    const list = this._get(this.KEYS.VEHICLES, []);
    const vehicle = list.find(v => String(v.id) === String(id));
    if (vehicle) {
      vehicle.featured = !vehicle.featured;
      vehicle.updatedAt = new Date().toISOString();
      this._set(this.KEYS.VEHICLES, list);
      return vehicle.featured;
    }
    return null;
  },

  /**
   * Returns vehicle metrics
   * @returns {{total: number, disponible: number, reservado: number, vendido: number, autos: number, motos: number}}
   */
  getVehicleCount() {
    const list = this._get(this.KEYS.VEHICLES, []);
    return {
      total: list.length,
      disponible: list.filter(v => v.status === 'disponible').length,
      reservado: list.filter(v => v.status === 'reservado').length,
      vendido: list.filter(v => v.status === 'vendido').length,
      autos: list.filter(v => v.type === 'auto').length,
      motos: list.filter(v => v.type === 'moto').length
    };
  },

  // =========================================================================
  // INQUIRIES API
  // =========================================================================

  /**
   * Retrieves inquiries optionally filtered
   * @param {Object} [filters={}]
   * @returns {Array}
   */
  getInquiries(filters = {}) {
    let list = this._get(this.KEYS.INQUIRIES, []);

    if (filters.read !== undefined) {
      list = list.filter(i => Boolean(i.read) === Boolean(filters.read));
    }
    if (filters.responded !== undefined) {
      list = list.filter(i => Boolean(i.responded) === Boolean(filters.responded));
    }
    if (filters.type && filters.type !== 'todos') {
      list = list.filter(i => i.type === filters.type);
    }

    // Default: newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  },

  /**
   * Saves a new inquiry
   * @param {Object} inquiry
   * @returns {Object} Saved inquiry
   */
  saveInquiry(inquiry) {
    if (!inquiry) throw new Error('Inquiry data is required');
    const list = this._get(this.KEYS.INQUIRIES, []);

    const newInquiry = {
      id: inquiry.id || ('inq_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)),
      vehicleId: inquiry.vehicleId || null,
      vehicleName: inquiry.vehicleName || null,
      name: inquiry.name ? inquiry.name.trim() : '',
      phone: inquiry.phone ? inquiry.phone.trim() : '',
      email: inquiry.email ? inquiry.email.trim() : '',
      message: inquiry.message ? inquiry.message.trim() : '',
      type: inquiry.type || 'general',
      read: false,
      responded: false,
      createdAt: new Date().toISOString()
    };

    list.unshift(newInquiry);
    this._set(this.KEYS.INQUIRIES, list);
    return newInquiry;
  },

  /**
   * Marks inquiry as read
   * @param {string} id
   * @returns {boolean}
   */
  markInquiryRead(id) {
    const list = this._get(this.KEYS.INQUIRIES, []);
    const inq = list.find(i => String(i.id) === String(id));
    if (inq) {
      inq.read = true;
      this._set(this.KEYS.INQUIRIES, list);
      return true;
    }
    return false;
  },

  /**
   * Marks inquiry as responded
   * @param {string} id
   * @returns {boolean}
   */
  markInquiryResponded(id) {
    const list = this._get(this.KEYS.INQUIRIES, []);
    const inq = list.find(i => String(i.id) === String(id));
    if (inq) {
      inq.responded = true;
      inq.read = true;
      this._set(this.KEYS.INQUIRIES, list);
      return true;
    }
    return false;
  },

  /**
   * Deletes inquiry by ID
   * @param {string} id
   * @returns {boolean}
   */
  deleteInquiry(id) {
    const list = this._get(this.KEYS.INQUIRIES, []);
    const filtered = list.filter(i => String(i.id) !== String(id));
    if (filtered.length !== list.length) {
      this._set(this.KEYS.INQUIRIES, filtered);
      return true;
    }
    return false;
  },

  /**
   * Returns count of unread inquiries
   * @returns {number}
   */
  getUnreadCount() {
    const list = this._get(this.KEYS.INQUIRIES, []);
    return list.filter(i => !i.read).length;
  },

  // =========================================================================
  // AUTHENTICATION API
  // =========================================================================

  /**
   * Verifies username and password against stored admin
   * @param {string} username
   * @param {string} password
   * @returns {boolean}
   */
  verifyLogin(username, password) {
    const admin = this._get(this.KEYS.ADMIN, null);
    if (!admin) return false;
    const passHash = this._hash(password);
    return admin.user === username && admin.passHash === passHash;
  },

  /**
   * Checks if user is authenticated in current session
   * @returns {boolean}
   */
  isLoggedIn() {
    try {
      if (typeof sessionStorage === 'undefined') return false;
      const token = sessionStorage.getItem(this.KEYS.SESSION_TOKEN);
      return Boolean(token);
    } catch {
      return false;
    }
  },

  /**
   * Logs in and generates session token
   * @param {string} username
   * @param {string} password
   * @returns {{success: boolean, message: string}}
   */
  login(username, password) {
    const admin = this._get(this.KEYS.ADMIN, null);

    if (!admin) {
      return { success: false, message: 'El sistema de administración no está configurado.' };
    }

    if (admin.user !== username) {
      return { success: false, message: 'Usuario incorrecto.' };
    }

    if (this._hash(password) !== admin.passHash) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }

    try {
      const token = 'token_' + Date.now().toString(36) + '_' + this._hash(username);
      sessionStorage.setItem(this.KEYS.SESSION_TOKEN, token);
      return { success: true, message: 'Inicio de sesión exitoso.' };
    } catch {
      return { success: false, message: 'Error al crear la sesión. Intente recargar la página.' };
    }
  },

  /**
   * Logs out current session
   */
  logout() {
    try {
      sessionStorage.removeItem(this.KEYS.SESSION_TOKEN);
    } catch (e) {
      console.error(e);
    }
  },

  /**
   * Changes admin password
   * @param {string} oldPass
   * @param {string} newPass
   * @returns {boolean}
   */
  changePassword(oldPass, newPass) {
    const admin = this._get(this.KEYS.ADMIN, null);
    if (!admin) return false;
    if (admin.passHash !== this._hash(oldPass)) {
      return false;
    }
    admin.passHash = this._hash(newPass);
    this._set(this.KEYS.ADMIN, admin);
    return true;
  },

  // =========================================================================
  // PRIVATE HELPERS
  // =========================================================================

  _get(key, defaultValue = null) {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(key);
        return data !== null ? JSON.parse(data) : defaultValue;
      }
      return this._storage && this._storage[key] !== undefined ? this._storage[key] : defaultValue;
    } catch (e) {
      console.warn(`[DB] Error reading key "${key}":`, e);
      return defaultValue;
    }
  },

  _set(key, data) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
      }
      if (!this._storage) this._storage = {};
      this._storage[key] = data;
      return true;
    } catch (e) {
      console.error(`[DB] Error writing key "${key}":`, e);
      return false;
    }
  },

  _generateId() {
    return 'v_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  },

  _hash(str) {
    if (!str) return '';
    let hash = 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(16);
  }
};

// Initialize immediately
DB.init();

// Browser global exposure & CommonJS export
if (typeof window !== 'undefined') {
  window.DB = DB;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DB };
}
