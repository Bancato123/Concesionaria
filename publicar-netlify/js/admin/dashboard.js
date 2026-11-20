/**
 * Concesionaria Esteban CONCESIONARIA - ADMIN DASHBOARD LOGIC
 * Manages stats visualization, animated counters, vehicle table rendering, status updates, and delete confirmations.
 */

(function () {
  'use strict';

  var allVehicles = [];
  var vehicleToDeleteId = null;

  // Placeholder SVG image for vehicles without images
  var PLACEHOLDER_IMG = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%2280%22%20viewBox%3D%220%200%20100%2080%22%3E%3Crect%20fill%3D%22%23E2E8F0%22%20width%3D%22100%22%20height%3D%2280%22%2F%3E%3Cpath%20d%3D%22M25%2050l12-16%2010%2012%2015-18%2018%2022H25z%22%20fill%3D%22%23CBD5E1%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%2230%22%20r%3D%226%22%20fill%3D%22%23CBD5E1%22%2F%3E%3C%2Fsvg%3E';

  // Format price fallback if utils formatPrice is not yet loaded
  function safeFormatPrice(amount) {
    if (typeof formatPrice === 'function') {
      return formatPrice(amount);
    }
    var num = Number(amount) || 0;
    return '₲ ' + num.toLocaleString('es-PY');
  }

  // Safe escape HTML helper
  function safeEscape(str) {
    if (typeof escapeHtml === 'function') return escapeHtml(str);
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Animate count-up for numbers
  function animateCount(elem, target) {
    if (!elem) return;
    var start = 0;
    var finalVal = parseInt(target, 10) || 0;
    if (finalVal === 0) {
      elem.textContent = '0';
      return;
    }
    var duration = 800; // ms
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      var easeProgress = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(easeProgress * (finalVal - start) + start);
      elem.textContent = current.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        elem.textContent = finalVal.toLocaleString();
      }
    }

    window.requestAnimationFrame(step);
  }

  // Render stats counters
  function renderStats() {
    var counts = { total: 0, disponible: 0, reservado: 0, vendido: 0, autos: 0, motos: 0 };
    var unread = 0;

    if (typeof DB !== 'undefined') {
      if (typeof DB.getVehicleCount === 'function') {
        counts = DB.getVehicleCount();
      }
      if (typeof DB.getUnreadCount === 'function') {
        unread = DB.getUnreadCount();
      }
    }

    animateCount(document.getElementById('stat-total'), counts.total);
    animateCount(document.getElementById('stat-disponible'), counts.disponible);
    animateCount(document.getElementById('stat-reservado'), counts.reservado);
    animateCount(document.getElementById('stat-vendido'), counts.vendido);
    animateCount(document.getElementById('stat-consultas'), unread);

    // Also update badge in sidebar
    if (typeof updateSidebarUnreadCount === 'function') {
      updateSidebarUnreadCount();
    }
  }

  // Render Vehicles into Table
  function renderVehiclesTable(vehicles) {
    var tbody = document.getElementById('admin-vehicles-body');
    var emptyState = document.getElementById('admin-table-empty');
    var table = document.getElementById('admin-vehicles-table');
    var countLabel = document.getElementById('vehicles-count-label');

    if (!tbody) return;

    if (!vehicles || vehicles.length === 0) {
      tbody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (table) table.style.display = 'none';
      if (countLabel) countLabel.textContent = '0 vehículos encontrados';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (table) table.style.display = 'table';
    if (countLabel) {
      countLabel.textContent = 'Mostrando ' + vehicles.length + ' de ' + allVehicles.length + ' vehículos';
    }

    var html = '';
    vehicles.forEach(function (v) {
      var thumb = (v.images && v.images.length > 0 && v.images[0]) ? v.images[0] : PLACEHOLDER_IMG;
      var name = safeEscape((v.brand || '') + ' ' + (v.model || '') + ' (' + (v.year || '') + ')');
      var typeBadgeClass = (v.type === 'moto') ? 'badge--moto' : 'badge--auto';
      var typeText = (v.type === 'moto') ? 'Moto' : 'Auto';
      var formattedPrice = safeFormatPrice(v.price);
      var status = v.status || 'disponible';
      var isFeatured = Boolean(v.featured);
      var color = v.color ? safeEscape(v.color) : '';
      var mileage = v.mileage ? Number(v.mileage).toLocaleString() + ' km' : '0 km';

      html += '<tr data-id="' + v.id + '">';

      // Image Thumbnail
      html += '<td>';
      html += '  <img src="' + thumb + '" alt="' + name + '" class="admin-table__thumb" loading="lazy" onerror="this.src=\'' + PLACEHOLDER_IMG + '\'">';
      html += '</td>';

      // Vehicle Info
      html += '<td>';
      html += '  <a href="vehiculo-form.html?id=' + v.id + '" class="admin-table__vehicle-name">' + name + '</a>';
      html += '  <span class="admin-table__vehicle-sub">' + (color ? color + ' • ' : '') + mileage + '</span>';
      html += '</td>';

      // Type Badge
      html += '<td>';
      html += '  <span class="badge ' + typeBadgeClass + '">' + typeText + '</span>';
      html += '</td>';

      // Price
      html += '<td>';
      html += '  <strong style="color: var(--primary-dark); font-family: var(--font-heading);">' + formattedPrice + '</strong>';
      html += '</td>';

      // Status dropdown
      html += '<td>';
      html += '  <select class="admin-table__status-select admin-table__status-select--' + status + '" data-vehicle-id="' + v.id + '" aria-label="Cambiar estado">';
      html += '    <option value="disponible"' + (status === 'disponible' ? ' selected' : '') + '>Disponible</option>';
      html += '    <option value="reservado"' + (status === 'reservado' ? ' selected' : '') + '>Reservado</option>';
      html += '    <option value="vendido"' + (status === 'vendido' ? ' selected' : '') + '>Vendido</option>';
      html += '  </select>';
      html += '</td>';

      // Featured Star Button
      html += '<td style="text-align: center;">';
      html += '  <button type="button" class="admin-table__action admin-table__action--feature' + (isFeatured ? ' is-featured' : '') + '" data-vehicle-id="' + v.id + '" title="' + (isFeatured ? 'Quitar de destacados' : 'Marcar como destacado') + '" aria-label="Destacado">';
      html += '    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="' + (isFeatured ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
      html += '  </button>';
      html += '</td>';

      // Action Buttons (Edit + Delete)
      html += '<td style="text-align: right;">';
      html += '  <div class="admin-table__actions" style="justify-content: flex-end;">';
      html += '    <a href="vehiculo-form.html?id=' + v.id + '" class="admin-table__action admin-table__action--edit" title="Editar vehículo" aria-label="Editar">';
      html += '      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      html += '    </a>';
      html += '    <button type="button" class="admin-table__action admin-table__action--delete" data-delete-id="' + v.id + '" data-delete-name="' + name + '" title="Eliminar vehículo" aria-label="Eliminar">';
      html += '      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
      html += '    </button>';
      html += '  </div>';
      html += '</td>';

      html += '</tr>';
    });

    tbody.innerHTML = html;
    attachTableEventListeners();
  }

  // Attach dynamic event listeners to elements inside table
  function attachTableEventListeners() {
    // Status Change dropdowns
    var statusSelects = document.querySelectorAll('.admin-table__status-select');
    statusSelects.forEach(function (select) {
      select.addEventListener('change', function () {
        var vehicleId = this.getAttribute('data-vehicle-id');
        var newStatus = this.value;

        if (typeof DB !== 'undefined' && typeof DB.updateVehicleStatus === 'function') {
          DB.updateVehicleStatus(vehicleId, newStatus);
        }

        // Update CSS class on the select
        this.className = 'admin-table__status-select admin-table__status-select--' + newStatus;

        // Update local object in allVehicles
        var found = allVehicles.find(function (item) { return item.id == vehicleId; });
        if (found) found.status = newStatus;

        renderStats();

        if (typeof showToast === 'function') {
          showToast('Estado actualizado a "' + newStatus.toUpperCase() + '"', 'success');
        }
      });
    });

    // Toggle Featured star buttons
    var featureBtns = document.querySelectorAll('.admin-table__action--feature');
    featureBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var vehicleId = this.getAttribute('data-vehicle-id');
        var isNowFeatured = false;

        if (typeof DB !== 'undefined' && typeof DB.toggleFeatured === 'function') {
          var updated = DB.toggleFeatured(vehicleId);
          if (updated) isNowFeatured = updated.featured;
        } else {
          isNowFeatured = !this.classList.contains('is-featured');
        }

        // Update local state
        var found = allVehicles.find(function (item) { return item.id == vehicleId; });
        if (found) found.featured = isNowFeatured;

        if (isNowFeatured) {
          this.classList.add('is-featured');
          this.title = 'Quitar de destacados';
          var svgFilled = this.querySelector('svg');
          if (svgFilled) svgFilled.setAttribute('fill', 'currentColor');
          if (typeof showToast === 'function') {
            showToast('Vehículo agregado a Destacados', 'info');
          }
        } else {
          this.classList.remove('is-featured');
          this.title = 'Marcar como destacado';
          var svgEmpty = this.querySelector('svg');
          if (svgEmpty) svgEmpty.setAttribute('fill', 'none');
          if (typeof showToast === 'function') {
            showToast('Vehículo quitado de Destacados', 'info');
          }
        }
      });
    });

    // Delete Buttons
    var deleteBtns = document.querySelectorAll('.admin-table__action--delete');
    deleteBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-delete-id');
        var name = this.getAttribute('data-delete-name');
        openDeleteDialog(id, name);
      });
    });
  }

  // Delete Confirmation Dialog Handling
  function openDeleteDialog(id, name) {
    vehicleToDeleteId = id;
    var dialog = document.getElementById('confirm-dialog');
    var textElem = document.getElementById('confirm-text');

    if (textElem && name) {
      textElem.textContent = '¿Estás seguro de que deseas eliminar permanentemente "' + name + '" del catálogo? Esta acción no se puede revertir.';
    }

    if (dialog) {
      dialog.classList.add('active');
    }
  }

  function closeDeleteDialog() {
    vehicleToDeleteId = null;
    var dialog = document.getElementById('confirm-dialog');
    if (dialog) dialog.classList.remove('active');
  }

  function setupDeleteConfirmHandlers() {
    var dialog = document.getElementById('confirm-dialog');
    var cancelBtn = document.getElementById('confirm-cancel-btn');
    var deleteBtn = document.getElementById('confirm-delete-btn');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeDeleteDialog);
    }

    if (dialog) {
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) closeDeleteDialog();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dialog && dialog.classList.contains('active')) {
        closeDeleteDialog();
      }
    });

    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        if (!vehicleToDeleteId) return;

        var success = false;
        if (typeof DB !== 'undefined' && typeof DB.deleteVehicle === 'function') {
          success = DB.deleteVehicle(vehicleToDeleteId);
        } else {
          allVehicles = allVehicles.filter(function (v) { return v.id != vehicleToDeleteId; });
          success = true;
        }

        if (success) {
          allVehicles = allVehicles.filter(function (v) { return v.id != vehicleToDeleteId; });
          closeDeleteDialog();
          applyFilters();
          renderStats();
          if (typeof showToast === 'function') {
            showToast('Vehículo eliminado exitosamente', 'success');
          }
        } else {
          closeDeleteDialog();
          if (typeof showToast === 'function') {
            showToast('No se pudo eliminar el vehículo', 'error');
          }
        }
      });
    }
  }

  // Filter & Search Logic
  function applyFilters() {
    var searchInput = document.getElementById('admin-search');
    var typeSelect = document.getElementById('admin-filter-type');
    var statusSelect = document.getElementById('admin-filter-status');

    var searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
    var filterType = (typeSelect ? typeSelect.value : '').toLowerCase();
    var filterStatus = (statusSelect ? statusSelect.value : '').toLowerCase();

    var filtered = allVehicles.filter(function (v) {
      // Type filter
      if (filterType && (v.type || '').toLowerCase() !== filterType) {
        return false;
      }

      // Status filter
      if (filterStatus && (v.status || '').toLowerCase() !== filterStatus) {
        return false;
      }

      // Search term
      if (searchTerm) {
        var textContent = [
          v.brand || '',
          v.model || '',
          v.year || '',
          v.color || '',
          v.description || '',
          v.engine || ''
        ].join(' ').toLowerCase();

        if (textContent.indexOf(searchTerm) === -1) {
          return false;
        }
      }

      return true;
    });

    renderVehiclesTable(filtered);
  }

  // Debounce helper
  function safeDebounce(fn, delay) {
    if (typeof debounce === 'function') return debounce(fn, delay);
    var timer;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  // Initial Setup
  function initDashboard() {
    if (typeof DB !== 'undefined' && typeof DB.init === 'function') {
      DB.init();
    }

    // Load initial vehicles
    if (typeof DB !== 'undefined' && typeof DB.getVehicles === 'function') {
      allVehicles = DB.getVehicles() || [];
    }

    renderStats();
    renderVehiclesTable(allVehicles);
    setupDeleteConfirmHandlers();

    // Search input with debounce
    var searchInput = document.getElementById('admin-search');
    if (searchInput) {
      searchInput.addEventListener('input', safeDebounce(function () {
        applyFilters();
      }, 300));
    }

    // Filter selects
    var typeSelect = document.getElementById('admin-filter-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', applyFilters);
    }

    var statusSelect = document.getElementById('admin-filter-status');
    if (statusSelect) {
      statusSelect.addEventListener('change', applyFilters);
    }
  }

  document.addEventListener('DOMContentLoaded', initDashboard);

})();
