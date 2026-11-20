# Guía de Configuración: Google Analytics y Google Search Console

Esta guía paso a paso te explica cómo configurar **Google Analytics 4 (GA4)** y **Google Search Console (GSC)** en el sitio web de **Concesionaria Esteban**, de forma sencilla y sin conocimientos técnicos avanzados.

---

## Google Analytics 4

Google Analytics te permite conocer cuántas personas visitan el sitio web, qué autos o motos generan más interés y cuántas personas hacen clic para consultar por WhatsApp.

### Paso 1: Crear una cuenta de Google Analytics
1. Ingresá a [https://analytics.google.com](https://analytics.google.com).
2. Iniciá sesión con tu cuenta de Google (Gmail).
3. Hacé clic en el botón azul **"Empezar a medir"**.
4. **Nombre de la cuenta:** Ingresá `Concesionaria Esteban`.
5. **Nombre de la propiedad:** Ingresá `Sitio Web Concesionaria Esteban`.
6. Seleccioná tu zona horaria (**Paraguay / Asunción**) y la moneda (**Guaraní paraguayo - PYG** o **Dólar estadounidense - USD**).
7. Completá los detalles de la empresa:
   - **Categoría:** *Automóviles y vehículos*.
   - **Tamaño de la empresa:** *Pequeña (1 a 10 empleados)*.
8. Aceptá las condiciones del servicio de Google Analytics.

### Paso 2: Configurar el flujo de datos (Data Stream)
1. En la pantalla de selección de plataforma, elegí **"Web"**.
2. **URL del sitio web:** Ingresá tu dominio (ejemplo: `concesionariakevin.com` o la URL que uses en tu hosting).
3. **Nombre del flujo:** Ingresá `Sitio Web`.
4. Hacé clic en **"Crear flujo"**.
5. Google te mostrará los detalles del flujo. En la esquina superior derecha verás el **ID DE MEDICIÓN** con formato `G-XXXXXXXXXX` (ejemplo: `G-ABC1234567`). **Copiá ese código**.

### Paso 3: Agregar tu ID al sitio web
1. Abrí la carpeta del proyecto en tu computadora.
2. Ingresá a la carpeta `js/` y abrí el archivo `analytics.js` con cualquier editor de texto (Bloc de notas, VS Code, etc.).
3. En las primeras líneas encontrarás:
   ```javascript
   GA_MEASUREMENT_ID: 'G-XXXXXXXXXX',
   ```
4. Reemplazá `'G-XXXXXXXXXX'` por tu ID real copiado en el Paso 2 (por ejemplo: `'G-ABC1234567'`).
5. Guardá los cambios en el archivo (`Ctrl + S`).
6. Subí el archivo `js/analytics.js` actualizado a tu hosting.

### Paso 4: Verificar que funciona
1. Abrí tu sitio web en una pestaña de incógnito o en tu teléfono.
2. Cuando aparezca el banner de cookies en la parte inferior, hacé clic en **"Aceptar"**.
3. En otra pestaña, abrí tu panel de Google Analytics.
4. En el menú lateral izquierdo, andá a **Informes > En tiempo real**.
5. Deberías ver **1 usuario activo en los últimos 30 minutos** (sos vos navegando por el sitio). ¡Listo!

---

## Google Search Console

Google Search Console es la herramienta gratuita oficial de Google para que tu sitio aparezca en los resultados de búsqueda de Google, monitorear palabras clave y vigilar el estado de salud de tus páginas.

### Paso 1: Acceder a Search Console
1. Ingresá a [https://search.google.com/search-console](https://search.google.com/search-console).
2. Iniciá sesión con la misma cuenta de Google.
3. Hacé clic en **"Agregar propiedad"** (o en el selector de propiedades arriba a la izquierda).
4. En el asistente, seleccioná la opción de la derecha: **"Prefijo de la URL"**.
5. Ingresá la dirección completa de tu sitio con HTTPS (ejemplo: `https://concesionariakevin.com`).
6. Hacé clic en **"Continuar"**.

### Paso 2: Verificar la propiedad mediante Etiqueta HTML
1. En los métodos de verificación disponibles, buscá la sección **"Otros métodos de verificación"** y desplegá **"Etiqueta HTML"**.
2. Google te mostrará un código similar a este:
   ```html
   <meta name="google-site-verification" content="ABC123xyz_CODIGO_DE_VERIFICACION" />
   ```
3. Copiá únicamente el código que está dentro de `content="..."` (por ejemplo: `ABC123xyz_CODIGO_DE_VERIFICACION`).
4. Abrí el archivo `js/analytics.js` de tu sitio.
5. Buscá la función `injectSearchConsoleVerification` (cerca de la línea 240):
   ```javascript
   meta.content = 'YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE';
   ```
6. Reemplazá `YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE` con tu código copiado de Google.
7. Guardá y subí `js/analytics.js` a tu hosting.
8. Volvé a Google Search Console y hacé clic en el botón verde **"Verificar"**.
9. Verás el mensaje *"Propiedad verificada con éxito"*.

### Paso 3: Enviar el Sitemap (Mapa del Sitio)
1. En el panel izquierdo de Search Console, hacé clic en **"Sitemaps"** (en la sección *Indexación*).
2. En el campo *"Agregar un sitemap nuevo"*, escribí: `sitemap.xml`.
3. Hacé clic en **"Enviar"**.
4. En la tabla inferior verás el estado en verde: *"Correcto"*. Google comenzará a rastrear e indexar tus páginas de autos, motos y secciones legales.

### Paso 4: Monitorear el rendimiento SEO
- **Rendimiento:** Consultá cuántas personas vieron tu sitio en Google (impresiones), cuántas hicieron clic, qué porcentaje hace clic (CTR) y tu posición promedio en búsquedas de Coronel Oviedo.
- **Páginas / Indexación:** Comprobá que todas tus páginas (`index.html`, `vehiculo.html`, `privacidad.html`, `terminos.html`, `cookies.html`) estén indexadas correctamente por Google.
- **Experiencia y Core Web Vitals:** Verificá que la velocidad de carga en teléfonos móviles sea óptima para los compradores.

---

## Métricas Importantes para tu Concesionaria

### En Google Analytics:
1. **Usuarios activos:** Cuántos clientes potenciales entran a mirar autos y motos por día y por mes.
2. **Páginas y vehículos más vistos:** Cuáles modelos reciben más visitas para enfocar tus compras y promociones de inventario.
3. **Fuentes de tráfico:** De dónde vienen tus compradores:
   - *Organic Search:* Llegan desde búsquedas en Google ("autos en Coronel Oviedo").
   - *Organic Social:* Llegan desde redes sociales.
   - *Direct:* Personas que escriben la dirección directa o la reciben por WhatsApp.
4. **Eventos y Conversiones:**
   - `contact_whatsapp`: Clics en el botón para consultar por WhatsApp.
   - `view_item`: Vistas a fichas de vehículos específicos.
   - `generate_lead`: Envíos de formularios de cotización o tasación.
   - `search` y `filter_catalog`: Qué marcas, precios o filtros busca la gente.
5. **Dispositivos:** Qué porcentaje de usuarios visita el sitio desde teléfonos celulares versus computadoras (generalmente en Paraguay más del 85% es móvil).

### En Google Search Console:
1. **Consultas de búsqueda:** Qué palabras clave escriben los compradores en Google para encontrarte (ejemplo: *"concesionaria coronel oviedo"*, *"autos usados toyota oviedo"*, *"motos cuotas coronel oviedo"*).
2. **Páginas indexadas:** Cuántas páginas tiene Google guardadas en su catálogo de búsqueda.
3. **Errores de rastreo:** Si algún enlace roto o imagen caída necesita ser corregido.
4. **Core Web Vitals:** Evaluaciones de velocidad de Google para asegurar que el sitio no sea lento en redes móviles 4G/LTE.

---

## Funcionamiento del Banner de Cookies

El sitio web cuenta con un sistema de consentimiento automático que cumple con las mejores prácticas internacionales de privacidad y velocidad:
- **Aparición automática:** Se muestra únicamente a los usuarios que visitan el sitio por primera vez (o cuyo consentimiento previo venció tras 365 días).
- **Control total:** El usuario puede **Aceptar** o **Rechazar**:
  - Si hace clic en **Aceptar**: se inicializa Google Analytics 4, se anonimiza la dirección IP del usuario y se guardan las métricas.
  - Si hace clic en **Rechazar**: Google Analytics se mantiene bloqueado, no se descarga ningún script de seguimiento y se eliminan las cookies analíticas existentes.
- **Persistencia:** La decisión se guarda localmente en el navegador por **365 días**.
- **Reconfiguración:** Los usuarios pueden cambiar su decisión en cualquier momento desde la página de [Política de Cookies](cookies.html) haciendo clic en *"Cambiar mis preferencias de cookies"*.
- **Independiente:** El script funciona de manera autónoma sin retrasar la carga del resto del sitio web ni interferir con la navegación del catálogo.
