/**
 * Vehicles CRUD + Inquiries — Supabase backend
 * Panel de Gestión — Concesionaria Esteban
 */

import {
  supabase,
  requireSupabase,
  VEHICLES_TABLE,
  INQUIRIES_TABLE,
  IMAGES_BUCKET
} from '../supabase-client.js';
import { uploadImage, deleteImage } from './image-handler.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function normalizeVehicleImages(images) {
  if (!Array.isArray(images)) return [];
  const normalized = images.map((img, idx) => {
    if (typeof img === 'string') {
      return { url: img, path: null, isPrimary: idx === 0 };
    }
    if (img && typeof img === 'object' && img.url) {
      return { ...img, isPrimary: Boolean(img.isPrimary) };
    }
    return null;
  }).filter(Boolean);

  normalized.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  if (normalized.length && !normalized.some(i => i.isPrimary)) {
    normalized[0].isPrimary = true;
  }
  return normalized;
}

function sanitizeSearchTerm(value) {
  return String(value || '')
    .replace(/[,()%*\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── List vehicles ────────────────────────────────────────────────────────────
export async function listVehicles({ type = '', status = '', brand = '', search = '' } = {}) {
  const client = requireSupabase();

  let query = client
    .from(VEHICLES_TABLE)
    .select('id,type,brand,model,year,price,status,featured,condition,images,mileage,created_at')
    .order('created_at', { ascending: false });

  if (type)   query = query.eq('type', type);
  if (status) query = query.eq('status', status);
  if (brand)  query = query.ilike('brand', `%${sanitizeSearchTerm(brand)}%`);

  const term = sanitizeSearchTerm(search);
  if (term) {
    query = query.or(`brand.ilike.%${term}%,model.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ─── Get single vehicle ───────────────────────────────────────────────────────
export async function getVehicle(id) {
  const { data, error } = await requireSupabase()
    .from(VEHICLES_TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// ─── Create vehicle ───────────────────────────────────────────────────────────
export async function createVehicle(fields) {
  const { data, error } = await requireSupabase()
    .from(VEHICLES_TABLE)
    .insert([{ ...fields, images: fields.images || [], updated_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Update vehicle ───────────────────────────────────────────────────────────
export async function updateVehicle(id, fields) {
  const { data, error } = await requireSupabase()
    .from(VEHICLES_TABLE)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Delete vehicle (also deletes images) ────────────────────────────────────
export async function deleteVehicle(id) {
  const client = requireSupabase();

  // 1) Get current images to delete from storage
  const { data: vehicle } = await client
    .from(VEHICLES_TABLE)
    .select('images')
    .eq('id', id)
    .single();

  if (vehicle?.images?.length) {
    const paths = vehicle.images
      .map(i => (typeof i === 'string' ? null : i.path))
      .filter(Boolean);
    if (paths.length) {
      await client.storage.from(IMAGES_BUCKET).remove(paths);
    }
  }

  // 2) Delete DB row
  const { error } = await client.from(VEHICLES_TABLE).delete().eq('id', id);
  if (error) throw error;
}

// ─── Quick status change ──────────────────────────────────────────────────────
export async function setVehicleStatus(id, status) {
  const { error } = await requireSupabase()
    .from(VEHICLES_TABLE)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ─── Toggle featured ─────────────────────────────────────────────────────────
export async function toggleFeatured(id, featured) {
  const { error } = await requireSupabase()
    .from(VEHICLES_TABLE)
    .update({ featured, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ─── Upload images for a vehicle (returns updated images array) ───────────────
export async function uploadVehicleImages(vehicleId, files, existingImages = []) {
  const uploaded = [];
  for (const file of files) {
    try {
      const result = await uploadImage(file, vehicleId);
      uploaded.push({ url: result.url, path: result.path, isPrimary: false });
    } catch (e) {
      console.error('Upload error:', e);
    }
  }

  let images = [...existingImages, ...uploaded];

  // Ensure at least one is primary
  if (images.length && !images.some(i => i.isPrimary)) {
    images[0].isPrimary = true;
  }

  return images;
}

// ─── Remove image from vehicle ────────────────────────────────────────────────
export async function removeVehicleImage(vehicleId, imageIdx, images) {
  const img = images[imageIdx];
  if (img?.path) await deleteImage(img.path);

  const updated = images.filter((_, i) => i !== imageIdx);
  if (updated.length && !updated.some(i => i.isPrimary)) {
    updated[0].isPrimary = true;
  }
  return updated;
}

// ─── Inquiries ────────────────────────────────────────────────────────────────
export async function listInquiries({ status = '' } = {}) {
  let query = requireSupabase()
    .from(INQUIRIES_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function updateInquiryStatus(id, status) {
  const { error } = await requireSupabase()
    .from(INQUIRIES_TABLE)
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteInquiry(id) {
  const { error } = await requireSupabase()
    .from(INQUIRIES_TABLE)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getInquiryCounts() {
  const { data, error } = await requireSupabase()
    .from(INQUIRIES_TABLE)
    .select('status');
  if (error) throw error;

  return (data || []).reduce((acc, row) => {
    const status = row.status || 'nueva';
    acc[status] = (acc[status] || 0) + 1;
    acc.total = (acc.total || 0) + 1;
    return acc;
  }, { total: 0, nueva: 0, leida: 0, respondida: 0 });
}
