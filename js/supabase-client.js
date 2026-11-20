/**
 * Supabase Client — módulo compartido por el panel de gestión.
 * Lee la configuración de `window.SUPABASE_CONFIG` (js/supabase-config.js).
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const cfg = (typeof window !== 'undefined' && window.SUPABASE_CONFIG) || {};

export const SUPABASE_CONFIG = cfg;

export const SUPABASE_CONFIGURED = Boolean(
  cfg.url &&
  !/TU-PROYECTO/i.test(cfg.url) &&
  cfg.anonKey &&
  !/tu-anon-key/i.test(cfg.anonKey)
);

export const VEHICLES_TABLE = cfg.vehiclesTable || 'vehicles';
export const INQUIRIES_TABLE = cfg.inquiriesTable || 'inquiries';
export const IMAGES_BUCKET = cfg.imagesBucket || 'vehicle-images';
export const IMAGE_MAX_WIDTH = cfg.imageMaxWidth || 1600;
export const IMAGE_MAX_HEIGHT = cfg.imageMaxHeight || 1200;
export const IMAGE_QUALITY = cfg.imageQuality || 0.82;

export const supabase = SUPABASE_CONFIGURED
  ? createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    })
  : null;

/**
 * Devuelve el cliente o lanza un error claro si falta configuración.
 */
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Abrí js/supabase-config.js y reemplazá la URL y la anon key de tu proyecto.'
    );
  }
  return supabase;
}

export default supabase;
