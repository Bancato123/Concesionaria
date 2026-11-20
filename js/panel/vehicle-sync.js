/** Keep the legacy panel's local inventory synchronized with Supabase. */
import { requireSupabase, VEHICLES_TABLE } from '../supabase-client.js';
import { uploadImage } from './image-handler.js';

const MAP_KEY = 'ck_vehicle_remote_ids_v1';

function readMap() {
  try { return JSON.parse(localStorage.getItem(MAP_KEY) || '{}'); }
  catch { return {}; }
}

function fieldsFromLocal(vehicle) {
  return {
    type: vehicle.type === 'moto' ? 'moto' : 'auto',
    brand: String(vehicle.brand || '').trim(),
    model: String(vehicle.model || '').trim(),
    year: Number(vehicle.year),
    price: Number(vehicle.price),
    mileage: Number(vehicle.mileage) || 0,
    fuel: vehicle.fuel || null,
    transmission: vehicle.transmission || null,
    displacement: vehicle.displacement || null,
    engine: vehicle.engine || null,
    cc: vehicle.cc || null,
    color: vehicle.color || null,
    doors: vehicle.doors || null,
    condition: vehicle.condition === 'nuevo' ? 'nuevo' : 'usado',
    status: ['disponible', 'reservado', 'vendido'].includes(vehicle.status) ? vehicle.status : 'disponible',
    featured: Boolean(vehicle.featured),
    description: vehicle.description || null,
    traction: vehicle.traction || null,
    brakes: vehicle.brakes || null
  };
}

function matchKey(vehicle) {
  return [vehicle.brand, vehicle.model, vehicle.year, vehicle.price]
    .map(value => String(value || '').trim().toLowerCase())
    .join('|');
}

async function updateRemoteVehicle(client, id, fields) {
  // Do not request a singular representation from PATCH: PostgREST returns
  // PGRST116/406 when the filter matches zero rows. The exact count lets the
  // sync recover from stale IDs without treating that expected case as fatal.
  const { count, error } = await client.from(VEHICLES_TABLE)
    .update(fields, { count: 'exact' })
    .eq('id', id);
  if (error) throw error;
  if (count === null) throw new Error('Supabase no devolvió el conteo de filas actualizadas.');
  return count > 0 ? { id } : null;
}

async function remoteImages(images, remoteId) {
  const result = [];
  for (let index = 0; index < (Array.isArray(images) ? images.length : 0); index++) {
    const item = images[index];
    const image = typeof item === 'string' ? { url: item, isPrimary: index === 0 } : item;
    if (!image?.url) continue;
    if (String(image.url).startsWith('data:image/')) {
      const blob = await (await fetch(image.url)).blob();
      const file = new File([blob], `vehicle-${index}.${blob.type.includes('png') ? 'png' : 'jpg'}`, { type: blob.type });
      const uploaded = await uploadImage(file, remoteId);
      result.push({ ...uploaded, isPrimary: Boolean(image.isPrimary) });
    } else {
      result.push({ url: image.url, path: image.path || null, isPrimary: Boolean(image.isPrimary) });
    }
  }
  if (result.length && !result.some(image => image.isPrimary)) result[0].isPrimary = true;
  return result;
}

async function saveRemote(client, vehicle, map) {
  const localId = String(vehicle.id);
  const mappedId = map[localId] || null;
  const basic = fieldsFromLocal(vehicle);
  let remote;

  if (mappedId) {
    remote = await updateRemoteVehicle(client, mappedId, basic);
  }

  // A stale local mapping can point to a vehicle that was removed remotely.
  // Before inserting, look for an existing row with the same vehicle details
  // so a retry repairs the mapping without creating a duplicate.
  if (!remote) {
    const { data: matches, error: matchError } = await client.from(VEHICLES_TABLE)
      .select('id')
      .eq('brand', basic.brand)
      .eq('model', basic.model)
      .eq('year', basic.year)
      .eq('price', basic.price)
      .limit(1);
    if (matchError) throw matchError;

    if (matches?.length) {
      remote = await updateRemoteVehicle(client, matches[0].id, basic);
    }
  }

  if (!remote) {
    const { data, error } = await client.from(VEHICLES_TABLE).insert([basic]).select('id').single();
    if (error) throw error;
    remote = data;
  }

  map[localId] = remote.id;
  localStorage.setItem(MAP_KEY, JSON.stringify(map));

  const images = await remoteImages(vehicle.images, remote.id);
  const { error: imageError } = await client.from(VEHICLES_TABLE).update({ images }).eq('id', remote.id);
  if (imageError) throw imageError;
  DB.saveVehicle({ ...vehicle, images });
  return remote.id;
}

export async function syncVehicle(localId) {
  if (typeof DB === 'undefined') throw new Error('No se encontró el inventario local del panel.');
  const vehicle = DB.getVehicles().find(item => String(item.id) === String(localId));
  if (!vehicle) throw new Error('No se encontró el vehículo para sincronizar.');
  const client = requireSupabase();
  return saveRemote(client, vehicle, readMap());
}

export async function deleteSyncedVehicle(localId) {
  const map = readMap();
  const remoteId = map[String(localId)];
  if (!remoteId) return;
  const { error } = await requireSupabase().from(VEHICLES_TABLE).delete().eq('id', remoteId);
  if (error) throw error;
  delete map[String(localId)];
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}

export async function syncAllVehicles() {
  if (typeof DB === 'undefined') throw new Error('No se encontró el inventario local del panel.');
  const client = requireSupabase();
  const map = readMap();
  const localVehicles = DB.getVehicles();
  const { data: beforeSync, error: beforeSyncError } = await client
    .from(VEHICLES_TABLE).select('id,brand,model,year,price');
  if (beforeSyncError) throw beforeSyncError;
  const remoteByKey = new Map((beforeSync || []).map(row => [matchKey(row), row.id]));
  for (const vehicle of localVehicles) {
    if (!map[String(vehicle.id)]) {
      const matchingId = remoteByKey.get(matchKey(vehicle));
      if (matchingId) map[String(vehicle.id)] = matchingId;
    }
    await saveRemote(client, vehicle, map);
  }

  const { data, error } = await client.from(VEHICLES_TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const mappedIds = new Set(Object.values(map));
  const localIds = new Set(DB.getVehicles().map(vehicle => String(vehicle.id)));
  for (const row of data || []) {
    if (mappedIds.has(row.id) || localIds.has(String(row.id))) continue;
    DB.saveVehicle({
      ...row,
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      images: Array.isArray(row.images) ? row.images.map(image => typeof image === 'string' ? image : image.url) : []
    });
    map[String(row.id)] = row.id;
  }
  localStorage.setItem(MAP_KEY, JSON.stringify(map));
}
