/**
 * Supabase Configuration — Concesionaria Kevin
 * Coronel Oviedo, Paraguay
 *
 * IMPORTANTE: reemplazá `url` y `anonKey` con los valores de tu proyecto
 * en https://supabase.com/dashboard → Settings → API.
 *
 * La `anonKey` es pública por diseño (va en el navegador). La seguridad real
 * la aplican las políticas RLS del archivo `supabase/schema.sql`.
 *
 * Este archivo es un script clásico: se carga con <script src="js/supabase-config.js">
 * y expone `window.SUPABASE_CONFIG` / `window.SUPABASE_CONFIGURED`.
 */
(function (global) {
  'use strict';

  const config = {
    url: 'https://yhgnrugndaosuqctflov.supabase.co',   // URL corregida basada en el ID del proyecto
    anonKey: 'sb_publishable_aYM5V53v7MkVtX_82PTQ-w_CN_FZkhA',              // Clave pública (anon/public)

    vehiclesTable: 'vehicles',
    inquiriesTable: 'inquiries',
    imagesBucket: 'vehicle-images',

    imageMaxWidth: 1600,
    imageMaxHeight: 1200,
    imageQuality: 0.82
  };

  const urlOk = Boolean(config.url) && !/TU-PROYECTO/i.test(config.url);
  const keyOk = Boolean(config.anonKey) && !/tu-anon-key/i.test(config.anonKey);

  global.SUPABASE_CONFIG = config;
  global.SUPABASE_CONFIGURED = urlOk && keyOk;

  if (!global.SUPABASE_CONFIGURED && typeof console !== 'undefined') {
    console.info('[Supabase] Sin configurar. Editá js/supabase-config.js para conectar la base de datos. El sitio usará los datos locales de demostración.');
  }
})(typeof window !== 'undefined' ? window : globalThis);
