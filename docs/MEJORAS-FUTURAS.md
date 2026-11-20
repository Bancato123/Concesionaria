# 🚀 Hoja de Ruta & Mejoras Futuras
## Escalabilidad y Modernización — Concesionaria Esteban & Motos
### Coronel Oviedo, Paraguay

Este documento técnico está orientado tanto al dueño de la concesionaria como a desarrolladores web que deseen seguir escalando la plataforma de **Concesionaria Esteban & Motos**. La base ya funciona en la nube con Supabase (PostgreSQL + Storage + Auth); acá se listan las siguientes mejoras posibles: automatizaciones comerciales, notificaciones, roles y reportes.

---

## 1. ☁️ Base de Datos en la Nube (implementada)

### Del almacenamiento local a Supabase
El sitio y el panel ya usan Supabase como fuente principal de datos. El antiguo `localStorage` (`js/db.js` + `js/data.js`) quedó únicamente como **respaldo de demostración/offline** cuando Supabase no está configurado.

---

### Solución implementada: Supabase (PostgreSQL + Storage + Auth)

**Ya está integrado en el proyecto.** El sitio público lee el catálogo desde Supabase y el panel `/panel-gestion-2709/` gestiona vehículos, fotos y consultas con autenticación real.

- Esquema completo: `supabase/schema.sql`
- Guía de instalación: `docs/CONFIGURACION-SUPABASE.md`
- Adaptador del sitio público: `js/public-data.js`
- Cliente del panel: `js/supabase-client.js`

#### Cómo está organizado

| Tabla / bucket | Uso |
|---|---|
| `vehicles` | Inventario. `images` es JSONB con `{url, path, isPrimary}`. |
| `inquiries` | Consultas. `status`: `nueva`, `leida`, `respondida`. |
| `vehicle-images` | Bucket público de fotos (WebP). |

#### Seguridad

- RLS activo en ambas tablas.
- El público solo puede leer vehículos e insertar consultas nuevas.
- Solo usuarios autenticados pueden crear/editar/borrar vehículos y gestionar consultas.
- Las fotos se leen públicamente y se escriben solo con sesión iniciada.

#### Si necesitás reinstalar

1. Creá el proyecto en Supabase.
2. Ejecutá `supabase/schema.sql` en el SQL Editor.
3. Creá el usuario en Authentication → Users.
4. Pegá la URL y la anon key en `js/supabase-config.js`.

> El respaldo local (`js/db.js` + `js/data.js`) se mantiene solo como demostración/offline cuando Supabase no está configurado.

---

### Alternativa: Firebase (Google Cloud Firestore)
- **Base de datos NoSQL:** Google Cloud Firestore en tiempo real.
- **Ventaja:** Notificaciones instantáneas de nuevas consultas en la pantalla sin tener que recargar el navegador gracias a `onSnapshot()`.
- **Firebase Auth:** Inicio de sesión seguro con Google Workspace o correo y contraseña.

---

## 2. 🖼️ Subida y Optimización de Fotos con Cloudinary

### Ventajas de usar Cloudinary:
1. **Compresión inteligente automática:** Reduce una foto de 5 MB tomada con un celular moderno a menos de 200 KB sin perder nitidez visible.
2. **Conversión automática a WebP/AVIF:** Máxima velocidad de carga en teléfonos móviles 3G/4G en Paraguay.
3. **Cero saturación del navegador:** No utiliza memoria local.

### Implementación rápida:
1. Creá una cuenta gratuita en [cloudinary.com](https://cloudinary.com).
2. Generá un **Upload Preset** sin firmar (*Unsigned*) llamado `concesionariakevin_preset`.
3. Subí las fotos directamente mediante una petición `fetch`:
```javascript
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'concesionariakevin_preset');
  
  const res = await fetch('https://api.cloudinary.com/v1_1/tu-cloud-name/image/upload', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  return data.secure_url; // URL optimizada en la nube
}
```

---

## 3. 📲 Notificaciones Inmediatas por Telegram o WhatsApp

Cuando un cliente completa el formulario de contacto o solicita tasación en la web, el dueño de la concesionaria debería enterarse al instante en su teléfono:

### Opción A: Bot de Telegram (100% Gratuito y en 5 minutos)
1. Abrí Telegram y buscá a `@BotFather` para crear un bot (ej: `@ConcesionariaEstebanBot`).
2. Obtené el `TOKEN` del bot y el `CHAT_ID` del dueño.
3. Al guardarse una consulta en el sitio web, ejecutá un webhook:
```javascript
function notificarPorTelegram(consulta) {
  const token = '123456789:ABCDefgh...';
  const chatId = '987654321';
  const texto = `🚗 *NUEVA CONSULTA EN Concesionaria Esteban*\n\n` +
                `👤 *Cliente:* ${consulta.name}\n` +
                `📱 *Teléfono:* ${consulta.phone}\n` +
                `🚗 *Vehículo:* ${consulta.vehicleName || 'Consulta General'}\n` +
                `💬 *Mensaje:* ${consulta.message}`;

  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto,
      parse_mode: 'Markdown'
    })
  });
}
```

### Opción B: WhatsApp Business API / Webhooks
Integrar servicios como **Evolution API** o **Twilio** para que el sistema envíe una notificación directa de WhatsApp al equipo de ventas apenas entra un interesado.

---

## 4. 🖨️ Exportación a Ficha Técnica en PDF y Reporte en Excel

### Ficha Técnica de Parabrisas (Cartel de Venta PDF)
- Utilizando la librería [jsPDF](https://github.com/parallax/jsPDF), generar un cartel listo para imprimir en hoja tamaño A4 con el logo de **Concesionaria Esteban**, año, kilometraje, combustible, precio destacado en guaraníes y un código QR que lleve directamente a la publicación web del auto.

### Reporte de Inventario en Excel para Contabilidad
- Usando la librería [SheetJS (xlsx)](https://sheetjs.com), agregar un botón en el Dashboard: **"Exportar a Excel (.xlsx)"** que descargue el listado con costo, precio de venta, margen estimado, estado comercial y fecha de ingreso del stock.

---

## 5. 🔐 Autenticación Segura con Roles y JWT

El panel ya usa **Supabase Auth** con sesiones JWT y contraseñas gestionadas por Supabase. La asignación de roles (dueño / vendedor) es una mejora pendiente para cuando haya varios usuarios.

Para un entorno con múltiples vendedores:
- **Roles de Usuario:**
  - **Super Admin (Dueño):** Puede crear, editar y eliminar vehículos, modificar precios y visualizar estadísticas de facturación.
  - **Vendedor:** Puede consultar el inventario, marcar unidades como "Reservadas" y responder consultas de clientes, pero no puede borrar vehículos ni ver los costos internos.
- **Recuperación de contraseña vía email:** Integración con SendGrid o Resend para envío de correos transaccionales con token de restablecimiento seguro.

---

## 📅 Resumen de Prioridades Recomendadas

| Prioridad | Mejora | Beneficio Principal | Dificultad |
|---|---|---|---|
| **Hecho** | Base de Datos en Supabase | Sincronización PC y Celular en tiempo real | Implementado |
| **Alta** | Bot de Telegram para Consultas | Respuesta en menos de 5 minutos a nuevos leads | Baja (2 horas) |
| **Media** | Cloudinary para Fotos | Carga instantánea de fotos pesadas en celulares | Baja (3 horas) |
| **Media** | Ficha PDF para Parabrisas | Agilidad en el salón de ventas físico en Cnel. Oviedo | Media (1 día) |
| **Baja** | Roles de Vendedores | Control de permisos para negocios con más de 3 empleados | Media (2 días) |

---
*Concesionaria Esteban & Motos — Arquitectura escalable y preparada para el futuro.*
