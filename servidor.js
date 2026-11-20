const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 8080);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8'
};

http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Solicitud inválida');
    return;
  }

  const requested = path.resolve(root, `.${pathname}`);
  if (requested !== root && !requested.startsWith(root + path.sep)) {
    res.writeHead(403).end('Acceso denegado');
    return;
  }

  fs.stat(requested, (statError, stat) => {
    const file = !statError && stat.isDirectory() ? path.join(requested, 'index.html') : requested;
    fs.readFile(file, (error, content) => {
      if (error) {
        res.writeHead(error.code === 'ENOENT' ? 404 : 500).end('No se pudo cargar el archivo');
        return;
      }
      res.writeHead(200, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(content);
    });
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`Catálogo disponible en http://localhost:${port}`);
  console.log('Para otros dispositivos de la misma red, usá la dirección IPv4 de esta PC.');
  console.log('Dejá esta ventana abierta mientras quieras compartir el sitio.');
});
