/**
 * Concesionaria Kevin CONCESIONARIA - MOCK DATA & CONSTANTS
 * Coronel Oviedo, Paraguay
 */

const DEFAULT_VEHICLES = []; // El catálogo inicia vacío: solo se muestran vehículos cargados por la concesionaria.

const BRANDS_AUTO = [
  'Chevrolet',
  'Fiat',
  'Hyundai',
  'Kia',
  'Nissan',
  'Toyota',
  'Volkswagen'
];

const BRANDS_MOTO = [
  'Honda',
  'Yamaha',
  'Zanella'
];

const FUELS = [
  'nafta',
  'diesel',
  'electrico',
  'flex'
];

const TRANSMISSIONS = [
  'manual',
  'automatica'
];

const COLORS = [
  'Azul Gravity',
  'Azul Racing',
  'Blanco',
  'Blanco Perla',
  'Gris Oscuro',
  'Gris Titanium',
  'Negro',
  'Negro Midnight',
  'Negro Storm',
  'Plata Bari',
  'Rojo',
  'Rojo Flash',
  'Rojo/Negro'
];

const CONDITIONS = [
  'nuevo',
  'usado'
];

const DEFAULT_INQUIRIES = [
  {
    id: 'inq001',
    vehicleId: 'a001',
    vehicleName: 'Toyota Corolla XEI 2023',
    name: 'Carlos Benítez',
    phone: '595981123456',
    email: 'carlos.benitez@gmail.com',
    message: 'Buenas tardes, quisiera saber si aceptan vehículo como parte de pago y cuáles son los planes de financiación.',
    type: 'vehiculo',
    read: false,
    responded: false,
    createdAt: '2024-11-06T14:20:00Z'
  },
  {
    id: 'inq002',
    vehicleId: null,
    vehicleName: null,
    name: 'María González',
    phone: '595972987654',
    email: 'maria.gonzalez@hotmail.com',
    message: 'Hola, tengo una Kia Rio 2018 para entregar y quisiera una cotización estimada de tasación.',
    type: 'tasacion',
    read: true,
    responded: true,
    createdAt: '2024-11-04T09:15:00Z'
  },
  {
    id: 'inq003',
    vehicleId: null,
    vehicleName: null,
    name: 'Rodrigo Vera',
    phone: '595985443322',
    email: 'r.vera@outlook.com',
    message: 'Hola equipo Concesionaria Kevin, ¿cuál es el horario de atención en el local de Coronel Oviedo los días sábados?',
    type: 'general',
    read: true,
    responded: false,
    createdAt: '2024-11-02T11:00:00Z'
  }
];

// Browser global exposure & CommonJS export
if (typeof window !== 'undefined') {
  window.DEFAULT_VEHICLES = DEFAULT_VEHICLES;
  window.BRANDS_AUTO = BRANDS_AUTO;
  window.BRANDS_MOTO = BRANDS_MOTO;
  window.FUELS = FUELS;
  window.TRANSMISSIONS = TRANSMISSIONS;
  window.COLORS = COLORS;
  window.CONDITIONS = CONDITIONS;
  window.DEFAULT_INQUIRIES = DEFAULT_INQUIRIES;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_VEHICLES,
    BRANDS_AUTO,
    BRANDS_MOTO,
    FUELS,
    TRANSMISSIONS,
    COLORS,
    CONDITIONS,
    DEFAULT_INQUIRIES
  };
}
