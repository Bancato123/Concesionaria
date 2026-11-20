/**
 * Mantiene el título visible de la pestaña cuando cambia el vehículo.
 * Las funciones SEO y de datos estructurados permanecen como no-op para
 * conservar compatibilidad con las llamadas existentes sin publicar metadatos.
 */
const SEO = {
  setMeta(title) {
    if (typeof document === 'undefined' || !title) return;
    document.title = title;
  },
  setOpenGraph() {},
  injectAutoDealer() {},
  injectVehicle() {},
  injectBreadcrumbs() {}
};

if (typeof window !== 'undefined') window.SEO = SEO;
if (typeof module !== 'undefined' && module.exports) module.exports = { SEO };
