/** User-facing Spanish messages for common Supabase inventory failures. */
export function vehicleErrorMessage(error) {
  const raw = String(error?.message || error || '').trim();
  const message = raw.toLowerCase();

  if (!raw) return 'No se pudieron cargar los vehículos. Intentá de nuevo.';
  if (message.includes('row-level security') || message.includes('permission denied') || error?.code === '42501') {
    return 'Supabase bloqueó el acceso a los vehículos. Ejecutá el esquema actualizado y verificá los permisos de la cuenta.';
  }
  if (message.includes('relation') && message.includes('does not exist') || error?.code === '42P01') {
    return 'No se encontró la tabla de vehículos en Supabase. Ejecutá supabase/schema.sql.';
  }
  if (message.includes('bucket') || message.includes('storage')) {
    return 'No se pudieron sincronizar las fotos. Revisá el bucket vehicle-images y sus permisos en Supabase.';
  }
  if (message.includes('failed to fetch') || message.includes('network') || message.includes('load failed')) {
    return 'No hay conexión con Supabase. Revisá internet y volvé a intentarlo.';
  }
  if (message.includes('duplicate key') || error?.code === '23505') {
    return 'Ya existe un vehículo con esos datos en Supabase. Actualizá el panel e intentá de nuevo.';
  }
  return 'No se pudieron cargar o sincronizar los vehículos. Revisá la configuración de Supabase e intentá de nuevo.';
}
