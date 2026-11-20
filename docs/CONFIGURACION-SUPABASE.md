# ⚙️ Configuración de Supabase — Concesionaria Kevin

Guía paso a paso para conectar el **Panel de Gestión** (`/panel-gestion-2709/`) y el sitio público con una base de datos en la nube.

> **Tiempo estimado:** 15 minutos.
> **Costo:** el plan gratuito de Supabase alcanza de sobra para una concesionaria.

---

## 1. Crear la cuenta y el proyecto

1. Entrá a **https://supabase.com** y creá una cuenta gratuita.
2. Hacé clic en **New Project**.
3. Completá:
   - **Name:** `concesionaria-kevin`
   - **Database Password:** una contraseña fuerte (guardala).
   - **Region:** `South America (São Paulo)` (la más cercana a Paraguay).
4. Esperá 1–2 minutos a que el proyecto termine de crearse.

---

## 2. Crear las tablas y la seguridad (RLS)

Todo el esquema ya está escrito en el archivo:

```
supabase/schema.sql
```

1. En Supabase, abrí **SQL Editor → New query**.
2. Abrí `supabase/schema.sql` con el Bloc de Notas, **copiá todo** y pegalo en el editor.
3. Hacé clic en **Run** (o `Ctrl + Enter`).
4. Deberías ver **"Success. No rows returned"**.

Ese archivo crea y configura automáticamente:

- Tabla **`vehicles`** (inventario).
- Tabla **`inquiries`** (consultas).
- Trigger de `updated_at`.
- Índices de rendimiento.
- Políticas **RLS**:
  - Cualquier visitante puede **ver vehículos**.
  - Cualquier visitante puede **enviar una consulta**.
  - Solo un usuario **autenticado** puede crear, editar, borrar vehículos y leer/borrar consultas.
- Bucket público **`vehicle-images`** con políticas de lectura pública y carga autenticada.

> ⚠️ **No cambies las políticas RLS** salvo que sepas lo que hacés. Son las que impiden que un visitante borre tu inventario o lea los datos de tus clientes.

### ¿Querés volver a ejecutarlo?

`supabase/schema.sql` es idempotente: podés correrlo otra vez sin perder datos. Solo actualiza políticas, índices y el bucket.

---

## 3. Verificar el bucket de imágenes

El script ya lo crea, pero conviene confirmar:

1. Andá a **Storage**.
2. Debe existir el bucket **`vehicle-images`**.
3. Tiene que estar marcado como **Public bucket**.
4. En la pestaña **Policies** deben aparecer 4 políticas:
   - lectura pública,
   - carga autenticada,
   - actualización autenticada,
   - borrado autenticado.

---

## 4. Crear el usuario del panel

1. En **Authentication → Settings**, desactivá el registro público.
2. Andá a **Authentication → Users** y hacé clic en **Add user → Create new user**.
3. Completá:
   - **Email:** el correo del dueño/encargado (ej. `kevinautos@gmail.com`).
   - **Password:** una contraseña segura de **8 caracteres o más**.
   - Marcá **Auto Confirm User** si la opción aparece.
4. Guardá.

5. No hace falta asignar metadatos o roles: cualquier cuenta creada manualmente y autenticada puede entrar al panel.
6. Mantené desactivado el registro público para que solo puedan entrar cuentas creadas por vos. Usá contraseñas únicas y activá MFA cuando sea posible.

> Ese correo y contraseña son los que vas a usar en `/panel-gestion-2709/`.
> Podés crear más usuarios después; cada cuenta autenticada tendrá acceso completo al panel. No habilites el registro público.

---

## 5. Conectar el código

1. En Supabase, andá a **Settings → API**.
2. Copiá:
   - **Project URL** (ej. `https://xyzabcdef.supabase.co`)
   - **anon public key** (la clave larga que empieza con `eyJ...`)
3. Abrí el archivo **`js/supabase-config.js`** y reemplazá solo estos dos valores:

```js
const config = {
  url: 'https://xyzabcdef.supabase.co',   // ← tu Project URL
  anonKey: 'eyJhbGciOiJIUzI1NiIs...',     // ← tu anon public key

  vehiclesTable: 'vehicles',
  inquiriesTable: 'inquiries',
  imagesBucket: 'vehicle-images',
  // ...
};
```

4. Guardá el archivo y subí el sitio a tu hosting (Netlify, Vercel, cPanel, etc.).

> 🔒 La **anon key es pública por diseño**: va en el navegador. La seguridad real la aplican las políticas RLS del paso 2. **Nunca** uses la `service_role` key en el frontend.

> Si alguna vez publicaste la contraseña antigua del panel, cambiala y no la reutilices.

---

## 6. Entrar al panel

1. Abrí `https://concesionariakevin.com/panel-gestion-2709/`.
2. Ingresá con el correo y la contraseña del paso 4.
3. Listo: el panel ya lee y escribe en Supabase.

Si ves el aviso **"Supabase todavía no está configurado"**, revisá que:

- `js/supabase-config.js` tenga la URL y la anon key reales (sin `TU-PROYECTO`).
- Hayas recargado la página con `Ctrl + F5`.
- El archivo se esté sirviendo desde el mismo dominio del sitio.

---

## 7. Cargar el primer vehículo

1. En el panel, hacé clic en **Nuevo Vehículo**.
2. Elegí **Auto** o **Moto**.
3. Completá marca, modelo, año, precio, condición y estado.
4. Subí las fotos: se comprimen y convierten a **WebP** automáticamente.
5. Arrastrá las fotos para ordenarlas. La que tenga ⭐ será la principal.
6. Hacé clic en **Guardar Vehículo**.

El vehículo aparece en el catálogo público de inmediato.

---

## 8. Consultas de clientes

- El formulario del sitio público y la ficha de cada vehículo guardan la consulta en la tabla `inquiries`.
- El panel muestra las consultas en **Consultas**, con pestañas **Todas / Nuevas / Leídas / Respondidas**.
- Al abrir una consulta nueva se marca como leída.
- El botón **Responder por WhatsApp** abre el chat con el cliente y la marca como respondida.

---

## Preguntas frecuentes

**¿Qué pasa si Supabase está caído o sin configurar?**
El sitio público sigue funcionando con los vehículos de demostración de `js/data.js` (solo lectura). Las consultas se guardan en el navegador como respaldo, pero no llegan al panel.

**¿Cuánto cuesta?**
El plan gratuito incluye 500 MB de base de datos, 1 GB de Storage y 50.000 usuarios activos por mes. Para una concesionaria mediana alcanza durante años.

**¿Cómo cambio la contraseña?**
Dentro del panel: **Ajustes → Cambiar contraseña**. También podés hacerlo desde Supabase → Authentication → Users.

**¿Puedo tener varios administradores?**
Sí. Creá un usuario por persona en Supabase → Authentication → Users.

**¿Cómo hago una copia de seguridad?**
Supabase → Database → Backups (el plan gratuito incluye backups diarios con retención corta). También podés exportar la tabla `vehicles` como CSV desde el Table Editor.

**Error `new row violates row-level security policy`**
Estás intentando escribir sin sesión iniciada, o las políticas del paso 2 no se ejecutaron. Volvé a correr `supabase/schema.sql` y verificá que iniciaste sesión en el panel.

**Las fotos dan error 403 al subir**
Revisá que el bucket `vehicle-images` exista y que las políticas de Storage del paso 2 estén creadas. El usuario debe estar autenticado.

---

## Archivos relacionados

| Archivo | Función |
|---|---|
| `js/supabase-config.js` | URL, anon key y nombres de tablas/bucket. |
| `js/supabase-client.js` | Cliente de Supabase compartido por el panel. |
| `js/public-data.js` | Adaptador del sitio público (lectura de vehículos y envío de consultas). |
| `supabase/schema.sql` | Tablas, índices, RLS y Storage. |
| `panel-gestion-2709/` | Panel de gestión nuevo. |
| `docs/USO-PANEL.md` | Manual de uso del panel. |

---

*Documentación oficial de Supabase: https://supabase.com/docs*
