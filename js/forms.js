/**
 * Concesionaria Esteban CONCESIONARIA - FORM VALIDATION & SUBMISSION HANDLER
 * Coronel Oviedo, Paraguay
 */

const FORMS = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{3,6}$/,

  /**
   * Initializes form validation, blur listeners and submission
   * @param {HTMLFormElement|string} formElement
   * @param {Object} [options={}]
   */
  init(formElement, options = {}) {
    // Acepta tanto un elemento, un selector ("#mi-form") como un id simple ("mi-form")
    let form = formElement;
    if (typeof formElement === 'string') {
      form = document.querySelector(formElement) || document.getElementById(formElement);
    }
    if (!form) return;

    // Remove browser default novalidate popups
    form.setAttribute('novalidate', 'true');

    const fields = form.querySelectorAll('input:not([type="submit"]):not([type="hidden"]), select, textarea');

    // Attach real-time validation on blur and input
    fields.forEach(field => {
      field.addEventListener('blur', () => {
        this.validateField(field);
      });

      field.addEventListener('input', () => {
        const group = field.closest('.form__group');
        if (group && group.classList.contains('form__group--error')) {
          this.validateField(field);
        }
      });
    });

    // Submit handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!this.validate(form)) {
        if (typeof showToast === 'function') {
          showToast('Por favor, revise los campos marcados en rojo', 'error');
        }
        // Focus first invalid input
        const firstInvalid = form.querySelector('.form__group--error input, .form__group--error select, .form__group--error textarea');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Collect form fields
      const formData = new FormData(form);
      const data = {};
      for (const [key, val] of formData.entries()) {
        data[key] = val;
      }

      this.submit(data, {
        ...options,
        formElement: form
      });
    });
  },

  /**
   * Validates all required fields in the form
   * @param {HTMLFormElement} formElement
   * @returns {boolean}
   */
  validate(formElement) {
    if (!formElement) return false;
    let isValid = true;
    const fields = formElement.querySelectorAll('input:not([type="submit"]):not([type="hidden"]), select, textarea');

    fields.forEach(field => {
      const fieldValid = this.validateField(field);
      if (!fieldValid) {
        isValid = false;
      }
    });

    return isValid;
  },

  /**
   * Validates single field and updates error message UI
   * @param {HTMLElement} input
   * @returns {boolean}
   */
  validateField(input) {
    if (!input) return false;
    const group = input.closest('.form__group');
    let errorEl = group ? group.querySelector('.form__error') : null;

    if (!errorEl && group) {
      errorEl = document.createElement('div');
      errorEl.className = 'form__error';
      group.appendChild(errorEl);
    }

    const value = (input.value || '').trim();
    const isRequired = input.hasAttribute('required') || input.dataset.required === 'true';
    const type = input.getAttribute('type') || input.tagName.toLowerCase();
    const name = input.getAttribute('name') || '';

    let errorMessage = '';

    // Required check
    if (isRequired && !value) {
      errorMessage = 'Este campo es obligatorio.';
    } else if (value) {
      // Email check
      if (type === 'email' || name.toLowerCase().includes('email')) {
        if (!this.EMAIL_REGEX.test(value)) {
          errorMessage = 'Ingrese un correo electrónico válido.';
        }
      }
      // Phone check
      else if (type === 'tel' || name.toLowerCase().includes('phone') || name.toLowerCase().includes('telefono')) {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 6) {
          errorMessage = 'Ingrese un número de teléfono válido (mín. 6 dígitos).';
        }
      }
      // Min length check
      else if (input.hasAttribute('minlength')) {
        const min = parseInt(input.getAttribute('minlength'), 10);
        if (value.length < min) {
          errorMessage = `Debe tener al menos ${min} caracteres.`;
        }
      }
    }

    if (errorMessage) {
      if (group) group.classList.add('form__group--error');
      if (errorEl) {
        errorEl.textContent = errorMessage;
        errorEl.style.display = 'block';
      }
      return false;
    } else {
      if (group) group.classList.remove('form__group--error');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
      }
      return true;
    }
  },

  /**
   * Submits inquiry data to DB and displays feedback
   * @param {Object} formData
   * @param {Object} options
   */
  async submit(formData, options = {}) {
    try {
      const inquiryPayload = {
        vehicleId: options.vehicleId || formData.vehicleId || null,
        vehicleName: options.vehicleName || formData.vehicleName || null,
        name: formData.name || formData.nombre || '',
        phone: formData.phone || formData.telefono || '',
        email: formData.email || '',
        message: formData.message || formData.mensaje || '',
        type: options.type || formData.type || (options.vehicleId ? 'vehiculo' : 'general')
      };

      // Extra tasación vehicle info formatting
      if (inquiryPayload.type === 'tasacion') {
        const extraInfo = [];
        if (formData.tasacion_brand) extraInfo.push(`Marca: ${formData.tasacion_brand}`);
        if (formData.tasacion_model) extraInfo.push(`Modelo: ${formData.tasacion_model}`);
        if (formData.tasacion_year) extraInfo.push(`Año: ${formData.tasacion_year}`);
        if (formData.tasacion_km) extraInfo.push(`Kilometraje: ${formData.tasacion_km} km`);
        if (formData.tasacion_condition) extraInfo.push(`Estado: ${formData.tasacion_condition}`);

        if (extraInfo.length) {
          inquiryPayload.message = `[DATOS DE TASACIÓN]\n${extraInfo.join('\n')}\n\n[COMENTARIOS]\n${inquiryPayload.message || 'Sin comentarios adicionales.'}`;
        }
      }

      // Save into local DB layer (copia de respaldo)
      let saved = null;
      if (typeof DB !== 'undefined' && typeof DB.saveInquiry === 'function') {
        try {
          saved = DB.saveInquiry(inquiryPayload);
        } catch (localErr) {
          console.warn('[FORMS] No se pudo guardar la copia local:', localErr);
        }
      } else {
        console.warn('[FORMS] DB layer not detected. Storing simulated inquiry.');
      }

      // Enviar a Supabase para que aparezca en el panel de gestión
      if (
        typeof PUBLIC_DATA !== 'undefined' &&
        typeof PUBLIC_DATA.submitInquiry === 'function' &&
        PUBLIC_DATA.configured
      ) {
        try {
          const remote = await PUBLIC_DATA.submitInquiry(inquiryPayload);
          if (remote) saved = remote;
        } catch (remoteErr) {
          console.error('[FORMS] Error al enviar la consulta a Supabase:', remoteErr);
          if (typeof showToast === 'function') {
            showToast('No pudimos enviar la consulta al servidor. Escribinos por WhatsApp.', 'error', 5000);
          }
          return;
        }
      }

      // Success feedback
      const successMsg = options.successMessage || '¡Consulta enviada con éxito! Nos comunicaremos a la brevedad.';
      if (typeof showToast === 'function') {
        showToast(successMsg, 'success', 4000);
      }

      // Reset form
      if (options.formElement && typeof options.formElement.reset === 'function') {
        options.formElement.reset();
        const errorGroups = options.formElement.querySelectorAll('.form__group--error');
        errorGroups.forEach(g => g.classList.remove('form__group--error'));
      }

      // Callback
      if (typeof options.onSubmit === 'function') {
        options.onSubmit(saved || inquiryPayload);
      }

      // Redirect if configured
      if (options.redirectUrl) {
        setTimeout(() => {
          window.location.href = options.redirectUrl;
        }, 1200);
      }
    } catch (error) {
      console.error('[FORMS] Error submitting form:', error);
      if (typeof showToast === 'function') {
        showToast('Ocurrió un error al enviar el formulario. Intente de nuevo.', 'error');
      }
    }
  },

  /**
   * Convenience initializer for vehicle inquiry or general contact forms
   * @param {string|HTMLFormElement} formId
   * @param {string|null} [vehicleId=null]
   * @param {string|null} [vehicleName=null]
   */
  setupContactForm(formId, vehicleId = null, vehicleName = null) {
    this.init(formId, {
      vehicleId,
      vehicleName,
      type: vehicleId ? 'vehiculo' : 'general',
      successMessage: '¡Gracias por contactarnos! Un asesor de Concesionaria Esteban te responderá a la brevedad.'
    });
  },

  /**
   * Convenience initializer for vehicle valuation (tasación) form
   * @param {string|HTMLFormElement} formId
   */
  setupTasacionForm(formId) {
    const form = typeof formId === 'string'
      ? (document.querySelector(formId) || document.getElementById(formId))
      : formId;
    if (!form) return;

    // Optional drag & drop file upload UI handler if file input exists
    const fileInput = form.querySelector('input[type="file"]');
    if (fileInput) {
      const dropZone = fileInput.closest('.upload-zone') || fileInput.parentElement;
      if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
          dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('upload-zone--active');
          });
        });

        ['dragleave', 'drop'].forEach(eventName => {
          dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('upload-zone--active');
          });
        });

        dropZone.addEventListener('drop', (e) => {
          if (e.dataTransfer && e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            if (typeof showToast === 'function') {
              showToast(`${e.dataTransfer.files.length} archivo(s) seleccionado(s)`, 'info');
            }
          }
        });
      }
    }

    this.init(form, {
      type: 'tasacion',
      successMessage: '¡Solicitud de tasación enviada! Analizaremos los datos de tu vehículo y te contactaremos.'
    });
  }
};

// Global browser exposure & CommonJS export
if (typeof window !== 'undefined') {
  window.FORMS = FORMS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FORMS };
}
