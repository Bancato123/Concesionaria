/**
 * Concesionaria Kevin CONCESIONARIA - VEHICLE CREATE / EDIT FORM LOGIC
 * Manages form state, dynamic fields by vehicle type, image upload with base64 conversion,
 * client-side validations, card preview modal, and storage persistence.
 */

(function () {
  'use strict';

  // Fallback brand constants if not defined in data.js
  var DEFAULT_BRANDS_AUTO = [
    'Toyota', 'Kia', 'Hyundai', 'Chevrolet', 'Volkswagen', 'Nissan',
    'Ford', 'Honda', 'Fiat', 'Jeep', 'BMW', 'Mercedes-Benz', 'Audi',
    'Peugeot', 'Renault', 'Mitsubishi', 'Suzuki', 'Mazda', 'BYD', 'Chery', 'Otra Marca'
  ];

  var DEFAULT_BRANDS_MOTO = [
    'Honda', 'Yamaha', 'Kenton', 'Taiga', 'Star', 'Leopard',
    'Kawasaki', 'BMW Motorrad', 'KTM', 'Bajaj', 'Suzuki', 'Harley-Davidson', 'Ducati', 'Otra Marca'
  ];

  var currentImages = [];
  var isEditMode = false;
  var editingVehicleId = null;

  // Placeholder SVG image for vehicles without images
  var DEFAULT_PLACEHOLDER_IMG = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22600%22%20height%3D%22400%22%20viewBox%3D%220%200%20600%20400%22%3E%3Crect%20fill%3D%22%231B2D4A%22%20width%3D%22600%22%20height%3D%22400%22%2F%3E%3Cpath%20d%3D%22M150%20270l80-90%2070%2070%2090-110%20110%20130H150z%22%20fill%3D%22%232A4365%22%2F%3E%3Ccircle%20cx%3D%22220%22%20cy%3D%22160%22%20r%3D%2235%22%20fill%3D%22%23FF6B00%22%20opacity%3D%220.8%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%22330%22%20font-family%3D%22sans-serif%22%20font-size%3D%2222%22%20fill%3D%22%23CBD5E1%22%20text-anchor%3D%22middle%22%3EConcesionaria Kevin%20-%20FOTO%20NO%20DISPONIBLE%3C%2Ftext%3E%3C%2Fsvg%3E';

  function safeFormatPrice(amount) {
    if (typeof formatPrice === 'function') {
      return formatPrice(amount);
    }
    var num = Number(amount) || 0;
    return '₲ ' + num.toLocaleString('es-PY');
  }

  function getBrandList(type) {
    if (type === 'moto') {
      return (typeof BRANDS_MOTO !== 'undefined' && Array.isArray(BRANDS_MOTO)) ? BRANDS_MOTO : DEFAULT_BRANDS_MOTO;
    }
    return (typeof BRANDS_AUTO !== 'undefined' && Array.isArray(BRANDS_AUTO)) ? BRANDS_AUTO : DEFAULT_BRANDS_AUTO;
  }

  // Populate brand dropdown according to selected vehicle type
  function updateBrandOptions(type, selectedBrand) {
    var brandSelect = document.getElementById('form-brand');
    if (!brandSelect) return;

    var brands = getBrandList(type);
    var html = '<option value="">-- Seleccionar Marca --</option>';

    brands.forEach(function (b) {
      var isSelected = (selectedBrand && selectedBrand.toLowerCase() === b.toLowerCase());
      html += '<option value="' + b + '"' + (isSelected ? ' selected' : '') + '>' + b + '</option>';
    });

    brandSelect.innerHTML = html;
  }

  // Show/Hide fields depending on Auto vs Moto
  function handleTypeToggle(type) {
    var autoFields = document.querySelectorAll('.auto-only');
    var motoFields = document.querySelectorAll('.moto-only');

    if (type === 'moto') {
      autoFields.forEach(function (el) { el.style.display = 'none'; });
      motoFields.forEach(function (el) { el.style.display = 'flex'; });
    } else {
      autoFields.forEach(function (el) { el.style.display = 'flex'; });
      motoFields.forEach(function (el) { el.style.display = 'none'; });
    }
  }

  // Update image preview grid
  function renderImagePreviews() {
    var previewContainer = document.getElementById('image-preview');
    if (!previewContainer) return;

    if (currentImages.length === 0) {
      previewContainer.innerHTML = '';
      return;
    }

    var html = '';
    currentImages.forEach(function (dataUri, index) {
      var isMain = (index === 0);
      html += '<div class="admin-form__preview-item' + (isMain ? ' is-main' : '') + '">';
      html += '  <img src="' + dataUri + '" class="admin-form__preview-img" alt="Foto ' + (index + 1) + '">';
      if (isMain) {
        html += '  <span class="admin-form__preview-badge">Principal</span>';
      }
      html += '  <button type="button" class="admin-form__preview-remove" data-index="' + index + '" title="Eliminar foto" aria-label="Eliminar foto">';
      html += '    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      html += '  </button>';
      html += '</div>';
    });

    previewContainer.innerHTML = html;

    // Attach click listeners to remove buttons
    var removeButtons = previewContainer.querySelectorAll('.admin-form__preview-remove');
    removeButtons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(this.getAttribute('data-index'), 10);
        removeImageAtIndex(idx);
      });
    });
  }

  function removeImageAtIndex(idx) {
    if (idx >= 0 && idx < currentImages.length) {
      currentImages.splice(idx, 1);
      renderImagePreviews();
      if (typeof showToast === 'function') {
        showToast('Foto eliminada', 'info');
      }
    }
  }

  // Handle file uploads (FileReader -> Base64)
  function handleFiles(files) {
    if (!files || files.length === 0) return;

    var remainingSlots = 5 - currentImages.length;
    if (remainingSlots <= 0) {
      if (typeof showToast === 'function') {
        showToast('Se alcanzó el límite máximo de 5 fotografías', 'warning');
      }
      return;
    }

    var filesToProcess = Array.prototype.slice.call(files, 0, remainingSlots);

    var filesProcessed = 0;
    filesToProcess.forEach(function (file) {
      if (!file.type.match(/^image\//)) {
        if (typeof showToast === 'function') {
          showToast('El archivo "' + file.name + '" no es una imagen válida', 'error');
        }
        return;
      }

      var reader = new FileReader();
      reader.onload = function (e) {
        currentImages.push(e.target.result);
        filesProcessed++;
        if (filesProcessed === filesToProcess.length) {
          renderImagePreviews();
          if (typeof showToast === 'function') {
            showToast(filesProcessed + (filesProcessed === 1 ? ' foto agregada' : ' fotos agregadas'), 'success');
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Setup file upload interactions (click & drag-and-drop)
  function setupImageUploadHandlers() {
    var uploadBox = document.getElementById('image-upload');
    var fileInput = document.getElementById('image-input');

    if (!uploadBox || !fileInput) return;

    uploadBox.addEventListener('click', function () {
      fileInput.click();
    });

    uploadBox.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', function () {
      handleFiles(this.files);
      this.value = ''; // Reset for re-selection
    });

    // Drag and Drop
    ['dragenter', 'dragover'].forEach(function (eventName) {
      uploadBox.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        uploadBox.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(function (eventName) {
      uploadBox.addEventListener(eventName, function (e) {
        e.preventDefault();
        e.stopPropagation();
        uploadBox.classList.remove('dragover');
      }, false);
    });

    uploadBox.addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      if (dt && dt.files) {
        handleFiles(dt.files);
      }
    }, false);
  }

  // Clear all validation errors
  function clearValidationErrors() {
    var errorElements = document.querySelectorAll('.form__error');
    errorElements.forEach(function (el) {
      el.classList.remove('is-visible');
    });

    var invalidInputs = document.querySelectorAll('.is-invalid');
    invalidInputs.forEach(function (input) {
      input.classList.remove('is-invalid');
    });
  }

  // Show validation error on a field
  function showFieldError(fieldId, errorId, message) {
    var field = document.getElementById(fieldId);
    var err = document.getElementById(errorId);
    if (field) field.classList.add('is-invalid');
    if (err) {
      if (message) err.textContent = message;
      err.classList.add('is-visible');
    }
  }

  // Validate form
  function validateForm() {
    clearValidationErrors();
    var isValid = true;
    var firstErrorField = null;

    var type = document.getElementById('form-type').value;
    var brand = document.getElementById('form-brand').value;
    var model = document.getElementById('form-model').value.trim();
    var year = parseInt(document.getElementById('form-year').value, 10);
    var color = document.getElementById('form-color').value.trim();
    var condition = document.getElementById('form-condition').value;
    var price = parseFloat(document.getElementById('form-price').value);
    var mileage = document.getElementById('form-mileage').value;

    if (!type) {
      showFieldError('form-type', 'error-type');
      isValid = false;
      if (!firstErrorField) firstErrorField = document.getElementById('form-type');
    }

    if (!brand) {
      showFieldError('form-brand', 'error-brand');
      isValid = false;
      if (!firstErrorField) firstErrorField = document.getElementById('form-brand');
    }

    if (!model) {
      showFieldError('form-model', 'error-model');
      isValid = false;
      if (!firstErrorField) firstErrorField = document.getElementById('form-model');
    }

    var currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1990 || year > currentYear + 1) {
      showFieldError('form-year', 'error-year', 'El año debe estar entre 1990 y ' + (currentYear + 1));
      isValid = false;
      if (!firstErrorField) firstErrorField = document.getElementById('form-year');
    }

    if (!color) {
      showFieldError('form-color', 'error-color');
      isValid = false;
      if (!firstErrorField) firstErrorField = document.getElementById('form-color');
    }

    if (!condition) {
      showFieldError('form-condition', 'error-condition');
      isValid = false;
      if (!firstErrorField) firstErrorField = document.getElementById('form-condition');
    }

    if (isNaN(price) || price <= 0) {
      showFieldError('form-price', 'error-price');
      isValid = false;
      if (!firstErrorField) firstErrorField = document.getElementById('form-price');
    }

    if (mileage === '' || isNaN(parseInt(mileage, 10)) || parseInt(mileage, 10) < 0) {
      showFieldError('form-mileage', 'error-mileage');
      isValid = false;
      if (!firstErrorField) firstErrorField = document.getElementById('form-mileage');
    }

    // Moto specific validation
    if (type === 'moto') {
      var cc = parseInt(document.getElementById('form-cc').value, 10);
      if (isNaN(cc) || cc <= 0) {
        showFieldError('form-cc', 'error-cc');
        isValid = false;
        if (!firstErrorField) firstErrorField = document.getElementById('form-cc');
      }
    }

    if (firstErrorField) {
      firstErrorField.focus();
    }

    return isValid;
  }

  // Build Vehicle Object from form data
  function buildVehicleObject() {
    var type = document.getElementById('form-type').value;
    var brand = document.getElementById('form-brand').value;
    var model = document.getElementById('form-model').value.trim();
    var year = parseInt(document.getElementById('form-year').value, 10);
    var color = document.getElementById('form-color').value.trim();
    var condition = document.getElementById('form-condition').value;
    var price = parseFloat(document.getElementById('form-price').value);
    var mileage = parseInt(document.getElementById('form-mileage').value, 10) || 0;
    var engine = (document.getElementById('form-engine').value || '').trim();
    var description = (document.getElementById('form-description').value || '').trim();
    var status = document.getElementById('form-status').value || 'disponible';
    var featured = document.getElementById('form-featured').checked;

    var vehicle = {
      type: type,
      brand: brand,
      model: model,
      year: year,
      color: color,
      condition: condition,
      price: price,
      mileage: mileage,
      engine: engine,
      description: description,
      status: status,
      featured: featured,
      images: currentImages.length > 0 ? currentImages : [DEFAULT_PLACEHOLDER_IMG]
    };

    if (isEditMode && editingVehicleId) {
      vehicle.id = editingVehicleId;
    }

    if (type === 'auto') {
      vehicle.fuel = document.getElementById('form-fuel').value;
      vehicle.transmission = document.getElementById('form-transmission').value;
      vehicle.doors = parseInt(document.getElementById('form-doors').value, 10) || 4;
      vehicle.cc = null;
    } else {
      vehicle.cc = parseInt(document.getElementById('form-cc').value, 10) || null;
      vehicle.fuel = 'nafta';
      vehicle.transmission = 'manual';
      vehicle.doors = null;
    }

    return vehicle;
  }

  // Setup Preview Modal
  function setupPreviewModal() {
    var previewBtn = document.getElementById('form-preview-btn');
    var modal = document.getElementById('preview-modal');
    var backdrop = document.getElementById('preview-modal-backdrop');
    var closeBtn = document.getElementById('preview-modal-close');
    var okBtn = document.getElementById('preview-modal-ok');
    var container = document.getElementById('preview-card-container');

    if (!modal) return;

    function openModal() {
      var v = buildVehicleObject();
      var thumb = (v.images && v.images.length > 0) ? v.images[0] : DEFAULT_PLACEHOLDER_IMG;
      var title = (v.brand || 'Marca') + ' ' + (v.model || 'Modelo');
      var priceFormatted = safeFormatPrice(v.price || 0);
      var badgeStatus = v.status || 'disponible';
      var spec1 = v.year ? v.year : 'Año';
      var spec2 = v.mileage !== undefined ? (Number(v.mileage).toLocaleString() + ' km') : '0 km';
      var spec3 = v.type === 'moto' ? ((v.cc || 'cc') + ' cc') : (v.transmission || 'Automática');

      container.innerHTML = 
        '<div style="position: relative; aspect-ratio: 16/10; overflow: hidden; background: #0A1628;">' +
        '  <img src="' + thumb + '" style="width: 100%; height: 100%; object-fit: cover;" alt="' + title + '">' +
        '  <span class="badge badge--' + badgeStatus + '" style="position: absolute; top: 12px; left: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">' + badgeStatus + '</span>' +
        (v.featured ? '  <span style="position: absolute; top: 12px; right: 12px; background: #FF6B00; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 0.7rem; font-weight: 700;">★ Destacado</span>' : '') +
        '</div>' +
        '<div style="padding: 1.25rem;">' +
        '  <span style="font-size: 0.75rem; text-transform: uppercase; color: #FF6B00; font-weight: 700; letter-spacing: 0.05em;">' + (v.type === 'moto' ? 'MOTO' : 'AUTO') + ' • ' + (v.condition || 'Usado') + '</span>' +
        '  <h4 style="margin: 0.25rem 0 0.5rem 0; font-size: 1.25rem; font-family: var(--font-heading);">' + title + '</h4>' +
        '  <div style="font-size: 1.35rem; font-weight: 800; color: var(--primary); font-family: var(--font-heading); margin-bottom: 0.75rem;">' + priceFormatted + '</div>' +
        '  <div style="display: flex; gap: 0.5rem; font-size: 0.8rem; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 0.75rem;">' +
        '    <span>📅 ' + spec1 + '</span> • ' +
        '    <span>⚡ ' + spec2 + '</span> • ' +
        '    <span>⚙️ ' + spec3 + '</span>' +
        '  </div>' +
        '</div>';

      modal.classList.add('active');
    }

    function closeModal() {
      modal.classList.remove('active');
    }

    if (previewBtn) previewBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (okBtn) okBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // Populate form with existing vehicle data for editing
  function populateForEdit(vehicle) {
    isEditMode = true;
    editingVehicleId = vehicle.id;

    var titleElem = document.getElementById('page-title');
    var breadcrumbElem = document.getElementById('breadcrumb-action');
    var submitText = document.getElementById('submit-btn-text');

    if (titleElem) titleElem.textContent = 'Editar Vehículo';
    if (breadcrumbElem) breadcrumbElem.textContent = 'Editar: ' + vehicle.brand + ' ' + vehicle.model;
    if (submitText) submitText.textContent = 'Actualizar Vehículo';

    document.getElementById('form-vehicle-id').value = vehicle.id;
    document.getElementById('form-type').value = vehicle.type || 'auto';

    handleTypeToggle(vehicle.type || 'auto');
    updateBrandOptions(vehicle.type || 'auto', vehicle.brand);

    document.getElementById('form-model').value = vehicle.model || '';
    document.getElementById('form-year').value = vehicle.year || '';
    document.getElementById('form-color').value = vehicle.color || '';
    document.getElementById('form-condition').value = vehicle.condition || 'Usado';
    document.getElementById('form-price').value = vehicle.price || '';
    document.getElementById('form-mileage').value = vehicle.mileage !== undefined ? vehicle.mileage : '';
    document.getElementById('form-engine').value = vehicle.engine || '';
    document.getElementById('form-description').value = vehicle.description || '';
    document.getElementById('form-status').value = vehicle.status || 'disponible';
    document.getElementById('form-featured').checked = Boolean(vehicle.featured);

    if (vehicle.type === 'auto') {
      if (vehicle.fuel) document.getElementById('form-fuel').value = vehicle.fuel;
      if (vehicle.transmission) document.getElementById('form-transmission').value = vehicle.transmission;
      if (vehicle.doors) document.getElementById('form-doors').value = vehicle.doors;
    } else {
      if (vehicle.cc) document.getElementById('form-cc').value = vehicle.cc;
    }

    // Price preview hint
    var priceHint = document.getElementById('price-formatted-preview');
    if (priceHint && vehicle.price) {
      priceHint.textContent = safeFormatPrice(vehicle.price);
    }

    // Load existing images
    if (vehicle.images && Array.isArray(vehicle.images)) {
      currentImages = vehicle.images.slice();
      renderImagePreviews();
    }
  }

  // Main Initializer
  function init() {
    if (typeof DB !== 'undefined' && typeof DB.init === 'function') {
      DB.init();
    }

    var typeSelect = document.getElementById('form-type');
    var priceInput = document.getElementById('form-price');
    var priceHint = document.getElementById('price-formatted-preview');
    var form = document.getElementById('vehicle-form');

    // Type change handler
    if (typeSelect) {
      typeSelect.addEventListener('change', function () {
        var newType = this.value;
        updateBrandOptions(newType);
        handleTypeToggle(newType);
      });
    }

    // Live price formatter hint
    if (priceInput && priceHint) {
      priceInput.addEventListener('input', function () {
        var val = this.value;
        if (val) {
          priceHint.textContent = safeFormatPrice(val);
        } else {
          priceHint.textContent = '₲ 0';
        }
      });
    }

    setupImageUploadHandlers();
    setupPreviewModal();

    // Check URL parameters for edit ID
    var urlParams = new URLSearchParams(window.location.search);
    var idParam = urlParams.get('id');

    if (idParam) {
      var foundVehicle = null;
      if (typeof DB !== 'undefined' && typeof DB.getVehicle === 'function') {
        foundVehicle = DB.getVehicle(idParam);
      }

      if (foundVehicle) {
        populateForEdit(foundVehicle);
      } else {
        if (typeof showToast === 'function') {
          showToast('No se encontró el vehículo solicitado', 'error');
        }
        setTimeout(function () {
          window.location.href = 'dashboard.html';
        }, 1200);
        return;
      }
    } else {
      // Default initial state
      updateBrandOptions('auto');
      handleTypeToggle('auto');
      var yearInput = document.getElementById('form-year');
      if (yearInput) yearInput.value = new Date().getFullYear();
    }

    // Form submission
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!validateForm()) {
          if (typeof showToast === 'function') {
            showToast('Por favor completá los campos obligatorios marcados en rojo', 'error');
          }
          return;
        }

        var vehicleData = buildVehicleObject();
        var submitBtn = document.getElementById('form-submit-btn');

        if (submitBtn) {
          submitBtn.disabled = true;
          var btnText = document.getElementById('submit-btn-text');
          if (btnText) btnText.textContent = 'Guardando...';
        }

        var saved = null;
        if (typeof DB !== 'undefined' && typeof DB.saveVehicle === 'function') {
          saved = DB.saveVehicle(vehicleData);
        } else {
          saved = vehicleData;
        }

        if (saved) {
          if (typeof showToast === 'function') {
            showToast('Vehículo ' + (isEditMode ? 'actualizado' : 'creado') + ' correctamente', 'success');
          }
          setTimeout(function () {
            window.location.href = 'dashboard.html';
          }, 900);
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            var btnTextReset = document.getElementById('submit-btn-text');
            if (btnTextReset) {
              btnTextReset.textContent = isEditMode ? 'Actualizar Vehículo' : 'Guardar Vehículo';
            }
          }
          if (typeof showToast === 'function') {
            showToast('Hubo un error al guardar el vehículo', 'error');
          }
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})();
