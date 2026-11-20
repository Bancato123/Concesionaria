/**
 * PUBLIC_DATA — Adaptador de datos públicos (Supabase → sitio web)
 * Concesionaria Kevin
 *
 * - Si Supabase está configurado, el catálogo y la ficha de vehículo leen
 *   directamente de la tabla `vehicles` y las consultas se insertan en
 *   `inquiries`.
 * - Si NO está configurado (o falla la red), devuelve `null` y el sitio usa
 *   el respaldo local (`js/db.js` + `DEFAULT_VEHICLES`), de modo que la web
 *   sigue funcionando para demostración/offline.
 *
 * Es un script clásico y expone `window.PUBLIC_DATA`.
 */
(function (global) {
  'use strict';

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // IDs of the original demo vehicles that were also seeded into Supabase.
  // Keep these out of the public catalog until they are removed from the DB.
  const DEMO_VEHICLE_IDS = new Set([
    'd50d0730-d13b-4553-936a-71f6a399a716', '12e52909-5fb5-49d9-9e63-cb0a2b07e0c9',
    '61bab8bb-73b1-470a-9756-97807d2bb21d', 'c90a307f-cecd-4f66-88fc-485d24ac8d18',
    '60697311-6259-4e08-bbb4-fb021ed65835', '20cba104-df6c-405c-9bfa-3739e6cf1a3a',
    '09e74d29-1582-4b88-915e-f631fc4aba80', 'd97e0c6b-1651-4754-b118-87d67df81021',
    '096e124e-a26a-4879-83e7-0b8ea857018b', '75f070ac-16e6-4768-aa7a-ba297a72e465',
    'e7cf3e7f-40ff-4bab-a0b9-e487d1ed2796', '9e7cd7ed-6967-4cd2-a3be-d623d0d86f49',
    '38037143-2c50-4c5c-97db-0044a1f837e8', '89fad8d0-ebe1-4577-8c52-c54aba4267a3'
  ]);

  function isConfigured() {
    return Boolean(global.SUPABASE_CONFIGURED);
  }

  function config() {
    return global.SUPABASE_CONFIG || {};
  }

  /**
   * Convierte las imágenes de Supabase (objetos {url,path,isPrimary} o strings)
   * al formato que espera el sitio público (array de URLs, principal primero).
   */
  function normalizeImages(images) {
    if (!Array.isArray(images)) return [];
    const items = images
      .map((img, idx) => {
        if (typeof img === 'string') {
          return { url: img, isPrimary: idx === 0 };
        }
        if (img && typeof img === 'object' && img.url) {
          return { url: img.url, isPrimary: Boolean(img.isPrimary) };
        }
        return null;
      })
      .filter(Boolean);

    items.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
    return items.map(item => item.url);
  }

  function normalizeVehicle(row) {
    if (!row || typeof row !== 'object') return null;

    return {
      id: row.id,
      type: row.type || 'auto',
      brand: row.brand || '',
      model: row.model || '',
      year: Number(row.year) || 0,
      price: Number(row.price) || 0,
      mileage: Number(row.mileage) || 0,
      fuel: row.fuel || '',
      transmission: row.transmission || '',
      displacement: row.displacement || '',
      engine: row.engine || '',
      cc: row.cc || null,
      color: row.color || '',
      doors: row.doors || null,
      traction: row.traction || '',
      brakes: row.brakes || '',
      condition: row.condition || 'usado',
      status: row.status || 'disponible',
      featured: Boolean(row.featured),
      description: row.description || '',
      images: normalizeImages(row.images),
      createdAt: row.created_at || row.createdAt || null,
      updatedAt: row.updated_at || row.updatedAt || null
    };
  }

  const PUBLIC_DATA = {
    _client: null,
    _clientPromise: null,
    _vehicles: null,
    _vehiclesPromise: null,

    get configured() {
      return isConfigured();
    },

    resetCache() {
      this._vehicles = null;
      this._vehiclesPromise = null;
    },

    async _getClient() {
      if (this._client) return this._client;
      if (!isConfigured()) return null;

      if (!this._clientPromise) {
        this._clientPromise = import('./supabase-client.js')
          .then(mod => {
            this._client = mod.supabase;
            return this._client;
          })
          .catch(err => {
            console.warn('[PUBLIC_DATA] No se pudo cargar Supabase:', err);
            return null;
          })
          .finally(() => {
            this._clientPromise = null;
          });
      }

      return this._clientPromise;
    },

    /**
     * Devuelve un array de vehículos normalizados, o `null` si Supabase no
     * está configurado o falló la consulta (para hacer fallback local).
     * @param {{force?: boolean}} [options]
     * @returns {Promise<Array|null>}
     */
    async getVehicles(options = {}) {
      if (!isConfigured()) return null;
      if (!options.force && this._vehicles) return this._vehicles;
      if (!options.force && this._vehiclesPromise) return this._vehiclesPromise;

      this._vehiclesPromise = (async () => {
        try {
          const client = await this._getClient();
          if (!client) return null;

          const table = config().vehiclesTable || 'vehicles';
          const { data, error } = await client
            .from(table)
            .select('*')
            .order('created_at', { ascending: false });

          console.log(`[DEBUG SUPABASE] Intentando leer tabla: ${table}`);
          if (error) {
            console.error('[DEBUG SUPABASE] Error de Supabase:', error);
            throw error;
          }
          console.log('[DEBUG SUPABASE] Datos recibidos:', data);

          this._vehicles = (data || [])
            .map(normalizeVehicle)
            .filter(vehicle => vehicle && !DEMO_VEHICLE_IDS.has(String(vehicle.id)));

          return this._vehicles;
        } catch (err) {
          console.warn('[PUBLIC_DATA] Falló la lectura de vehículos:', err);
          return null;
        } finally {
          this._vehiclesPromise = null;
        }
      })();

      return this._vehiclesPromise;
    },

    /**
     * Devuelve un vehículo por ID o `null`.
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getVehicle(id) {
      if (!id || !isConfigured()) return null;

      const vehicles = await this.getVehicles();
      if (!Array.isArray(vehicles)) return null;

      return vehicles.find(v => String(v.id) === String(id)) || null;
    },

    /**
     * Devuelve vehículos similares (mismo tipo y marca primero).
     * @param {Object} vehicle
     * @param {number} [limit=4]
     * @returns {Promise<Array|null>}
     */
    async getSimilar(vehicle, limit = 4) {
      if (!vehicle || !isConfigured()) return null;

      const vehicles = await this.getVehicles();
      if (!Array.isArray(vehicles)) return null;

      const sameType = vehicles.filter(v =>
        String(v.id) !== String(vehicle.id) && v.type === vehicle.type
      );

      sameType.sort((a, b) => {
        const aBrand = a.brand.toLowerCase() === String(vehicle.brand).toLowerCase();
        const bBrand = b.brand.toLowerCase() === String(vehicle.brand).toLowerCase();
        return Number(bBrand) - Number(aBrand);
      });

      return sameType.slice(0, limit);
    },

    /**
     * Inserta una consulta en Supabase.
     * @param {Object} payload
     * @returns {Promise<Object|null>} fila insertada o null si no está configurado
     */
    async submitInquiry(payload = {}) {
      if (!isConfigured()) return null;

      const client = await this._getClient();
      if (!client) throw new Error('No se pudo conectar con el servidor.');

      const vehicleId = payload.vehicleId && UUID_RE.test(String(payload.vehicleId))
        ? payload.vehicleId
        : null;

      const row = {
        name: String(payload.name || '').trim(),
        phone: String(payload.phone || '').trim(),
        email: String(payload.email || '').trim() || null,
        message: String(payload.message || '').trim(),
        vehicle_id: vehicleId,
        vehicle_name: String(payload.vehicleName || '').slice(0, 200) || null,
        status: 'nueva',
        source: ['vehiculo', 'tasacion'].includes(payload.type) ? payload.type : 'formulario'
      };

      const table = config().inquiriesTable || 'inquiries';
      const { error } = await client
        .from(table)
        .insert([row]);

      if (error) throw error;
      return { submitted: true };
    }
  };

  global.PUBLIC_DATA = PUBLIC_DATA;
})(typeof window !== 'undefined' ? window : globalThis);
