# 📖 Manual de Uso del Panel de Gestión
## Concesionaria Kevin & Motos — Coronel Oviedo, Paraguay

Este es el manual del **Panel de Gestión con Supabase**, el único panel activo del sitio. Reemplaza al antiguo `/admin/`, que guardaba los datos solo en un navegador.

- **Dirección del panel:** `https://concesionariakevin.com/panel-gestion-2709/`
- **Qué necesitás:** un correo y una contraseña creados en Supabase (ver `docs/CONFIGURACION-SUPABASE.md`).
- **Qué se guarda en la nube:** vehículos, fotos y consultas. Los cambios se ven en la web al instante.

---

## 🔑 1. Acceso

1. Abrí el navegador y entrá a `/panel-gestion-2709/`.
2. Ingresá tu **correo electrónico** y **contraseña**.
3. Hacé clic en **Iniciar Sesión**.

> 🔒 Si te equivocás 5 veces, el panel bloquea el acceso 15 minutos en ese dispositivo.
> ¿Olvidaste la contraseña? En Supabase → Authentication → Users → tu usuario → **Reset password**. También podés cambiarla desde **Ajustes** dentro del panel.

---

## 📊 2. Vehículos (Dashboard)

Al entrar vas a ver la lista completa del inventario.

- **Buscador:** filtrá por marca o modelo.
- **Filtros:** por tipo (Auto / Moto) y por estado (Disponible / Reservado / Vendido).
- **Cambiar estado:** usá el selector de la columna **Estado**. Se guarda al instante.
- **Destacar:** la estrella ⭐ hace que el vehículo aparezca primero en la sección de destacados de la portada.
- **Editar:** botón **Editar** en la fila del vehículo.
- **Eliminar:** botón rojo. Pide confirmación y borra también las fotos del Storage.

> 💡 **Consejo comercial:** en lugar de eliminar un vehículo vendido, cambialo a **Vendido** durante una o dos semanas. Demuestra movimiento y genera confianza. Después podés borrarlo.

---

## ➕ 3. Cargar un vehículo nuevo

1. Hacé clic en **Nuevo Vehículo** (menú lateral o botón superior).
2. Elegí **Auto** o **Moto**.
3. Completá:
   - **Marca** y **Modelo** (obligatorios).
   - **Año** (1980–2030) y **Precio en guaraníes** (sin puntos ni comas: `85000000`).
   - **Condición:** Usado o Nuevo (0 km).
   - **Kilometraje:** 0 si es 0 km.
   - **Combustible**, **Transmisión**, **Cilindrada** (motos), **Puertas** (autos), **Color**.
   - **Estado:** Disponible, Reservado o Vendido.
   - **Descripción:** equipamiento, mantenimiento, detalles que ayuden a vender.
   - **Destacado:** activalo si querés que aparezca en la portada.
4. **Fotos:**
   - Tocá la zona punteada o arrastrá las imágenes.
   - Se comprimen y convierten a **WebP** automáticamente.
   - Arrastrá para reordenar. La foto con ⭐ es la principal.
   - Al quitar una foto, se borra de Storage **solo cuando guardás** (así cancelar no rompe la ficha).
5. Hacé clic en **Guardar Vehículo**.
6. El vehículo aparece en el catálogo público al instante.

### Consejos para fotos que venden
1. Luz natural, de día; evitá el flash nocturno.
2. Lavá y aspirá el vehículo antes de fotografiar.
3. Incluí: frente en diagonal, trasera, tablero, asientos y llantas/motor.
4. Subí entre 4 y 8 fotos. La primera debe ser la más atractiva.

---

## ✏️ 4. Editar un vehículo

1. En la lista, hacé clic en **Editar**.
2. Cambiá precio, descripción, estado o fotos.
3. **Guardar Cambios**.

Los cambios impactan de inmediato en la web. Si subís fotos nuevas, se agregan al final; podés reordenarlas antes de guardar.

---

## 💬 5. Consultas de clientes

En el menú lateral, **Consultas**:

- El número naranja indica consultas **nuevas** sin leer.
- Pestañas: **Todas / Nuevas / Leídas / Respondidas**.
- Buscador por nombre, teléfono, correo, vehículo o mensaje.
- Al abrir una tarjeta, la consulta se marca como **Leída**.
- **Responder por WhatsApp:** abre WhatsApp con el número del cliente y un saludo ya escrito; la consulta queda como **Respondida**.
- **Eliminar:** borra la consulta definitivamente (pide confirmación).

> 📱 Los teléfonos que empiezan con `0` se convierten automáticamente al formato internacional de Paraguay (`595...`).

---

## ⚙️ 6. Ajustes

En **Ajustes** podés:

- **Cambiar tu contraseña** (mínimo 8 caracteres).
- Ver el **correo** de la cuenta activa.
- **Cerrar sesión** en el dispositivo.

Para crear otro administrador, hacelo desde Supabase → Authentication → Users.

---

## 💾 7. ¿Dónde se guardan los datos?

En **Supabase** (PostgreSQL + Storage), no en el navegador:

- Podés entrar desde cualquier computadora o celular.
- Los cambios se ven en el sitio público al instante.
- Las fotos se guardan en el bucket `vehicle-images`.
- Las consultas quedan en la tabla `inquiries` hasta que las elimines.

### Respaldo
- Supabase hace backups automáticos según tu plan.
- Para una copia manual: Supabase → Table Editor → `vehicles` → Export → CSV.

### Seguridad
- El sitio público **solo puede leer vehículos** y **enviar consultas**.
- Nadie sin sesión iniciada puede editar, borrar ni leer consultas.
- Nunca compartas tu contraseña ni la `service_role` key de Supabase.

---

## 🆘 Problemas frecuentes

| Problema | Solución |
|---|---|
| "Supabase no está configurado" | Revisá `js/supabase-config.js` y recargá con `Ctrl + F5`. |
| No puedo iniciar sesión | Verificá el correo/contraseña en Supabase → Authentication → Users. |
| "new row violates row-level security policy" | Volvé a ejecutar `supabase/schema.sql` y asegurate de tener sesión iniciada. |
| Las fotos no suben | Confirmá que el bucket `vehicle-images` existe y es público. |
| Un vehículo no aparece en la web | Revisá que esté en estado **Disponible** y recargá el catálogo. |
| Cambié algo y no se ve | Recargá con `Ctrl + F5`; el catálogo cachea unos segundos. |

---

## 📁 Archivos del proyecto

| Archivo | Para qué sirve |
|---|---|
| `panel-gestion-2709/index.html` | Login. |
| `panel-gestion-2709/dashboard.html` | Lista y gestión de vehículos. |
| `panel-gestion-2709/vehiculo-form.html` | Alta y edición de vehículos. |
| `panel-gestion-2709/consultas.html` | Bandeja de consultas. |
| `panel-gestion-2709/ajustes.html` | Contraseña y cuenta. |
| `js/public-data.js` | Conecta el sitio público con Supabase. |
| `supabase/schema.sql` | Base de datos y seguridad. |
| `docs/CONFIGURACION-SUPABASE.md` | Guía de instalación. |

---

*Concesionaria Kevin & Motos — Potenciando tu concesionaria en Coronel Oviedo.*
