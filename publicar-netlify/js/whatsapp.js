/**
 * Concesionaria Esteban CONCESIONARIA - WHATSAPP & SOCIAL INTEGRATION
 * Coronel Oviedo, Paraguay
 */

const WHATSAPP = {
  PHONE: '595994233136',

  /**
   * Generates general inquiry WhatsApp link
   * @returns {string}
   */
  getGeneralLink() {
    const message = 'Hola, me interesa conocer los vehículos disponibles en Concesionaria Esteban. ¿Me pueden dar más información?';
    return (typeof createWhatsAppLink === 'function')
      ? createWhatsAppLink(this.PHONE, message)
      : `https://wa.me/${this.PHONE}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Generates vehicle-specific WhatsApp link
   * @param {Object} vehicle
   * @returns {string}
   */
  getVehicleLink(vehicle) {
    if (!vehicle) return this.getGeneralLink();

    const message = `Holaa, me intereso el ${vehicle.brand || ''} ${vehicle.model || ''}, me podes comentar un poco mas sobre el?`;

    return (typeof createWhatsAppLink === 'function')
      ? createWhatsAppLink(this.PHONE, message)
      : `https://wa.me/${this.PHONE}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Generates response WhatsApp link for inquiries in the admin panel
   * @param {Object} inquiry
   * @returns {string}
   */
  getInquiryResponseLink(inquiry) {
    if (!inquiry || !inquiry.phone) return '';
    const name = inquiry.name || 'Cliente';
    const context = inquiry.vehicleName ? ` acerca del ${inquiry.vehicleName}` : '';
    const message = `Hola ${name}, gracias por tu consulta en Concesionaria Esteban${context}. Te escribimos para responder a tu mensaje: "${inquiry.message || ''}". ¿En qué más podemos ayudarte hoy?`;

    return (typeof createWhatsAppLink === 'function')
      ? createWhatsAppLink(inquiry.phone, message)
      : `https://wa.me/${inquiry.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  },

  /**
   * Injects the floating WhatsApp button into document.body
   */
  renderFloatingButtons() {
    if (typeof document === 'undefined') return;

    if (document.querySelector('.floating-buttons')) {
      return; // Already rendered
    }

    const container = document.createElement('div');
    container.className = 'floating-buttons';
    container.setAttribute('aria-label', 'Canales de contacto rápido');

    container.innerHTML = `
      <!-- WhatsApp Floating Button -->
      <a href="${this.getGeneralLink()}" 
         target="_blank" 
         rel="noopener noreferrer" 
         class="floating-btn floating-btn--whatsapp"
         aria-label="Contactar por WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span class="floating-btn__tooltip">Chatear por WhatsApp</span>
      </a>
    `;

    document.body.appendChild(container);
  }
};

// Automatic button injection on page load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => WHATSAPP.renderFloatingButtons());
  } else {
    WHATSAPP.renderFloatingButtons();
  }
}

// Global browser exposure & CommonJS export
if (typeof window !== 'undefined') {
  window.WHATSAPP = WHATSAPP;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WHATSAPP };
}
