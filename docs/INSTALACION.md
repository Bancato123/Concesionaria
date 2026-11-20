# 🚀 Guía de Instalación y Publicación en Internet
## Sitio Web Oficial & Panel Administrativo — Concesionaria Kevin & Motos
### Coronel Oviedo, Paraguay

Esta guía está diseñada paso a paso para que cualquier persona (incluso sin conocimientos técnicos de programación) pueda poner en línea el sitio web de **Concesionaria Kevin & Motos** en cuestión de minutos y comenzar a recibir clientes de inmediato.

---

## 📋 1. ¿Qué necesitás para empezar?

No necesitás instalar programas complejos ni contratar servidores costosos. El sitio web está desarrollado con tecnologías web estándar de alto rendimiento (HTML5, CSS3 y JavaScript moderno), lo que significa que es **100% estático, ultra veloz y sumamente económico de alojar**.

Solo necesitás:
1. **Una computadora** con acceso a internet.
2. **La carpeta del proyecto** con todos los archivos (`css/`, `js/`, `admin/`, `img/`, `index.html`, etc.).
3. **Un navegador web** moderno (Google Chrome, Microsoft Edge, Safari o Mozilla Firefox).

---

## 🌟 Opción 1: Netlify (La Opción Más Recomendada y 100% Gratuita)

Netlify es el proveedor líder mundial para sitios estáticos. Ofrece alta velocidad con servidores CDN mundiales, certificado SSL (candadito de seguridad verde) gratis y no requiere configurar bases de datos ni consolas.

### Pasos para publicar en Netlify:

1. **Crear una cuenta gratuita:**
   - Ingresá a [https://www.netlify.com](https://www.netlify.com).
   - Hacé clic en **"Sign up"** (Registrarse). Podés iniciar sesión rápidamente con tu cuenta de Google o correo electrónico.

2. **Subir los archivos mediante "Drag & Drop" (Arrastrar y Soltar):**
   - Una vez dentro del panel principal de Netlify (*Team overview* o *Sites*), buscá la sección que dice:  
     **"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"**.
   - Abrí el Explorador de Archivos de tu computadora, hacé clic sobre la carpeta del proyecto y **arrastrala directamente sobre la ventana de Netlify**.
   - Netlify procesará los archivos en menos de 10 segundos.

3. **¡Tu sitio ya está en vivo!**
   - Netlify te asignará una dirección web instantánea y segura con terminación `.netlify.app` (por ejemplo: `concesionariakevin-oviedo.netlify.app`).
   - Podés ingresar a esa URL desde tu celular o computadora y ver el sitio funcionando en tiempo real.

4. **Cambiar el nombre del subdominio gratuito:**
   - En Netlify, andá a **"Site configuration"** (Configuración del sitio).
   - En la sección **"Site details"**, hacé clic en **"Change site name"**.
   - Escribí por ejemplo: `concesionariakevin-autos` o `concesionariakevin-oviedo` y guardá los cambios. Tu nueva dirección será: `https://concesionariakevin-oviedo.netlify.app`.

5. **Conectar tu propio dominio (ej: `concesionariakevin.com` o `kevinautos.com`):**
   - En el menú lateral de Netlify, hacé clic en **"Domain management"** > **"Add a domain"**.
   - Escribí tu dominio adquirido y seguí las instrucciones en pantalla para apuntar los DNS (servidores de nombres). Netlify gestionará la renovación automática del certificado de seguridad SSL sin costo alguno.

---

## 🏢 Opción 2: Hosting Compartido Tradicional (cPanel / Bluehost / HostGator / DonWeb)

Si ya contás con un servicio de hosting contratado con cPanel, podés subir los archivos vía FTP usando el programa gratuito **FileZilla** o a través del Administrador de Archivos de cPanel.

### A) Subir mediante el Administrador de Archivos de cPanel:
1. Ingresá al panel de control de tu hosting (suele ser `tusitio.com:2083` o `cpanel.tusitio.com`).
2. Abrí la herramienta **"Administrador de Archivos"** (*File Manager*).
3. Navegá dentro de la carpeta raíz pública, normalmente llamada **`public_html`** o **`www`**.
4. En tu computadora, comprimí todos los archivos del proyecto en un archivo `.zip`.
5. En cPanel, hacé clic en **"Cargar"** (*Upload*) y seleccioná el archivo `.zip`.
6. Una vez subido, hacé clic derecho sobre el archivo en cPanel y elegí **"Extract"** (Extraer).
7. Verificá que el archivo `index.html` quede ubicado exactamente en la raíz de `public_html`.

### B) Subir mediante FTP (FileZilla):
1. Descargá e instalá **FileZilla Client** desde [https://filezilla-project.org](https://filezilla-project.org).
2. Abrí FileZilla y completá los datos de conexión que te brindó tu proveedor de hosting en la barra superior:
   - **Servidor (Host):** `ftp.tudominio.com` o la dirección IP de tu servidor.
   - **Nombre de usuario:** tu usuario de FTP.
   - **Contraseña:** tu contraseña de FTP.
   - **Puerto:** `21`.
   - Hacé clic en **"Conexión rápida"** (*Quickconnect*).
3. En la columna izquierda (*Sitio local*), navegá hasta la carpeta del proyecto en tu computadora.
4. En la columna derecha (*Sitio remoto*), ingresá a la carpeta **`public_html`**.
5. Seleccioná todos los archivos y carpetas locales y arrastralos hacia la columna derecha. Esperá a que finalice la cola de transferencias.

---

## 🐙 Opción 3: GitHub Pages (Gratis y con Control de Versiones)

Ideal si deseás mantener un historial de cambios y copias de seguridad automáticas en la nube:

1. Creá una cuenta en [https://github.com](https://github.com).
2. Hacé clic en el botón **"New"** para crear un nuevo repositorio.
3. Asignale un nombre (por ejemplo: `concesionariakevin-web`) y marcalo como **Public**.
4. Subí los archivos del proyecto al repositorio.
5. Andá a la pestaña **"Settings"** (Configuración) del repositorio > menú lateral **"Pages"**.
6. En **"Build and deployment"** > **Source**, seleccioná la rama `main` (o `master`) y la carpeta `/ (root)`.
7. Hacé clic en **"Save"**. En 1 o 2 minutos, GitHub te brindará la URL pública: `https://tuusuario.github.io/concesionariakevin-web/`.

---

## 🔒 5. Certificado de Seguridad SSL / HTTPS

Tener HTTPS (el candado cerrado en el navegador) es fundamental para transmitir confianza y asegurar que los clientes se sientan seguros al consultar:

- **En Netlify y GitHub Pages:** Se activa de forma automática e inmediata con certificados Let's Encrypt sin costo ni mantenimiento.
- **En cPanel / Hosting compartido:**
  1. Buscá en cPanel el ícono **"SSL/TLS Status"** o **"Let's Encrypt SSL"**.
  2. Seleccioná tu dominio y hacé clic en **"Run AutoSSL"** o **"Issue Certificate"**.
  3. Asegurate de activar la opción **"Force HTTPS Redirection"** (Forzar redirección HTTPS) para que todas las visitas siempre ingresen mediante conexión segura.

---

## 🌐 6. Recomendación de Dominio Propio para Paraguay

Para proyectar máxima seriedad y reconocimiento local en Coronel Oviedo y todo el territorio paraguayo:

- **Dominio Nacional:** `concesionariakevin.com.py` (Se registra en [https://www.nic.py](https://www.nic.py) a través de CNC/UNA).
- **Dominio Internacional:** `concesionariakevin.com` o `kevinautos.com` (Se registran en Namecheap, GoDaddy o Google Domains).

Una vez registrado el dominio, simplemente agregás los registros DNS de tipo `CNAME` o `A` que te indique tu proveedor de hosting (Netlify o cPanel).

---

## ⚙️ 7. Pasos Finales Posteriores a la Publicación

Una vez que tengas definida la dirección definitiva de tu sitio en internet (por ejemplo: `https://www.kevinautos.com.py`):

1. **Actualizar el mapa del sitio (`sitemap.xml`):**
   - Abrí el archivo `sitemap.xml` con cualquier editor de texto.
   - Reemplazá el dominio de ejemplo por tu dominio real en cada etiqueta `<loc>`:
     ```xml
     <loc>https://concesionariakevin.com/</loc>
     ```
2. **Actualizar el archivo de configuración móvil PWA (`manifest.json`):**
   - Verificá los campos `"start_url"` y `"scope"` para que apunten a la ruta correcta de tu sitio.
3. **Comprobar los números de WhatsApp:**
   - En `js/data.js` (o en la configuración del sitio), verificá que el número de teléfono para recibir consultas por WhatsApp tenga el código de país de Paraguay (`+595` o `5959XXXXXXXX`).
4. **Conectar y probar el Panel de Gestión:**
   - Seguí los pasos de [CONFIGURACION-SUPABASE.md](CONFIGURACION-SUPABASE.md): crear el proyecto, ejecutar `supabase/schema.sql`, crear el usuario y pegar la URL/anon key en `js/supabase-config.js`.
   - Ingresá a `https://tudominio.com/panel-gestion-2709/` con el correo y la contraseña que creaste en Supabase.
   - El panel anterior (`/admin/`) quedó deshabilitado: solo muestra un aviso con el enlace al panel nuevo.

---
*¿Dudas o consultas? Consultá el manual de uso del panel en [USO-PANEL.md](USO-PANEL.md).*
