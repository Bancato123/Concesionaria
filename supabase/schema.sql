-- ============================================================================
-- Concesionaria Kevin — Esquema de Supabase
-- Ejecutá TODO este archivo en Supabase → SQL Editor → New query → Run.
--
-- Crea:
--   1. Tabla `vehicles`  (inventario de autos y motos)
--   2. Tabla `inquiries` (consultas enviadas desde el sitio público)
--   3. Trigger de `updated_at`
--   4. Índices de rendimiento
--   5. Políticas RLS (lectura pública de vehículos, envío público de consultas,
--      gestión exclusiva para usuarios autenticados)
--   6. Bucket público `vehicle-images` y sus políticas de Storage
--
-- Es idempotente: podés volver a ejecutarlo sin perder datos.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. VEHÍCULOS
-- ============================================================================
create table if not exists public.vehicles (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  type          text not null check (type in ('auto', 'moto')),
  brand         text not null,
  model         text not null,
  year          integer not null check (year between 1900 and 2100),
  price         bigint not null check (price >= 0),
  mileage       integer not null default 0 check (mileage >= 0),

  fuel          text,
  transmission  text,
  displacement  text,
  engine        text,
  cc            integer,
  color         text,
  doors         smallint check (doors is null or doors between 0 and 10),

  condition     text not null default 'usado'
                check (condition in ('nuevo', 'usado')),
  status        text not null default 'disponible'
                check (status in ('disponible', 'reservado', 'vendido')),
  featured      boolean not null default false,

  description   text,
  images        jsonb not null default '[]'::jsonb,

  -- Campos opcionales que el sitio público sabe mostrar si existen.
  traction      text,
  brakes        text
);

comment on table public.vehicles is
  'Inventario de autos y motos de Concesionaria Kevin.';
comment on column public.vehicles.images is
  'Array JSON de imágenes: [{"url": "...", "path": "vehicleId/archivo.webp", "isPrimary": true}]';
comment on column public.vehicles.displacement is
  'Cilindrada para motos, por ejemplo "300cc".';

-- ============================================================================
-- 2. CONSULTAS
-- ============================================================================
create table if not exists public.inquiries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  name          text not null check (char_length(trim(name)) between 1 and 200),
  phone         text check (phone is null or char_length(phone) <= 40),
  email         text check (email is null or char_length(email) <= 254),
  message       text not null default ''
                check (char_length(message) <= 5000),

  vehicle_id    uuid references public.vehicles(id) on delete set null,
  vehicle_name  text check (vehicle_name is null or char_length(vehicle_name) <= 200),

  status        text not null default 'nueva'
                check (status in ('nueva', 'leida', 'respondida')),
  source        text not null default 'formulario'
                check (source in ('formulario', 'vehiculo', 'tasacion', 'general'))
);

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.inquiries'::regclass and conname = 'inquiries_vehicle_name_length_check') then
    alter table public.inquiries add constraint inquiries_vehicle_name_length_check
      check (vehicle_name is null or char_length(vehicle_name) <= 200);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.inquiries'::regclass and conname = 'inquiries_source_allowed_check') then
    alter table public.inquiries add constraint inquiries_source_allowed_check
      check (source in ('formulario', 'vehiculo', 'tasacion', 'general'));
  end if;
end $$;

comment on table public.inquiries is
  'Consultas de clientes. El público solo puede insertar; el panel autenticado las gestiona.';
comment on column public.inquiries.status is
  'nueva = sin leer, leida = abierta, respondida = contactado por WhatsApp.';

-- ============================================================================
-- 3. TRIGGER updated_at
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 4. ÍNDICES
-- ============================================================================
create index if not exists vehicles_created_at_idx on public.vehicles (created_at desc);
create index if not exists vehicles_type_idx       on public.vehicles (type);
create index if not exists vehicles_status_idx     on public.vehicles (status);
create index if not exists vehicles_brand_idx      on public.vehicles (lower(brand));
create index if not exists vehicles_featured_idx   on public.vehicles (featured) where featured = true;
create index if not exists vehicles_price_idx      on public.vehicles (price);
create index if not exists vehicles_year_idx       on public.vehicles (year);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx     on public.inquiries (status);
create index if not exists inquiries_vehicle_id_idx on public.inquiries (vehicle_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================
alter table public.vehicles  enable row level security;
alter table public.inquiries enable row level security;

-- Permisos base (RLS sigue siendo la barrera real).
revoke all on public.vehicles  from anon;
revoke all on public.inquiries from anon;
grant select on public.vehicles  to anon;
grant insert on public.inquiries to anon;
revoke all on public.vehicles, public.inquiries from authenticated;
grant select, insert, update, delete on public.vehicles, public.inquiries to authenticated;

-- ── Vehículos ───────────────────────────────────────────────────────────────
drop policy if exists "vehiculos_lectura_publica" on public.vehicles;
create policy "vehiculos_lectura_publica"
  on public.vehicles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "vehiculos_gestion_autenticada" on public.vehicles;
create policy "vehiculos_gestion_autenticada"
  on public.vehicles
  for all
  to authenticated
  using (true)
  with check (true);

-- ── Consultas ───────────────────────────────────────────────────────────────
-- Cualquier visitante puede enviar una consulta nueva, pero no puede leer,
-- editar ni borrar consultas de otras personas.
drop policy if exists "consultas_envio_publico" on public.inquiries;
create policy "consultas_envio_publico"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (status = 'nueva');

drop policy if exists "consultas_gestion_autenticada" on public.inquiries;
create policy "consultas_gestion_autenticada"
  on public.inquiries
  for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================================
-- 6. STORAGE — bucket público para fotos de vehículos
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-images', 'vehicle-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "imagenes_lectura_publica" on storage.objects;
create policy "imagenes_lectura_publica"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'vehicle-images');

drop policy if exists "imagenes_carga_autenticada" on storage.objects;
create policy "imagenes_carga_autenticada"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'vehicle-images');

drop policy if exists "imagenes_actualizacion_autenticada" on storage.objects;
create policy "imagenes_actualizacion_autenticada"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'vehicle-images')
  with check (bucket_id = 'vehicle-images');

drop policy if exists "imagenes_borrado_autenticado" on storage.objects;
create policy "imagenes_borrado_autenticado"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'vehicle-images');

-- ============================================================================
-- FIN
-- Después de ejecutar:
--   1. Authentication → Users → Add user (correo + contraseña del panel).
--   2. Settings → API → copiá Project URL y anon public key.
--   3. Pegalos en js/supabase-config.js.
-- ============================================================================
