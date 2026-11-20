/**
 * Concesionaria Kevin CONCESIONARIA - INQUIRIES & LEADS MANAGEMENT
 * Handles customer message display, read/unread states, WhatsApp direct responses,
 * status filtering, and deletion confirmations.
 */

(function () {
  'use strict';

  var allInquiries = [];
  var currentTab = 'all';
  var currentTypeFilter = '';
  var inquiryToDeleteId = null;

  // Safe escape HTML
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

  // Safe format date fallback
  function safeTimeAgo(isoString) {
    if (typeof timeAgo === 'function') {
      return timeAgo(isoString);
    }
    if (!isoString) return '';
    try {
      var date = new Date(isoString);
      return date.toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
  }

  // Safe WhatsApp link generator
  function safeWhatsAppLink(phone, message) {
    if (typeof createWhatsAppLink === 'function') {
      return createWhatsAppLink(phone, message);
    }
    var cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '595' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('595')) {
      cleanPhone = '595' + cleanPhone;
    }
    return 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(message || '');
  }

  // Update tab counters and header unread badge
  function updateCounters() {
    var total = allInquiries.length;
    var unread = allInquiries.filter(function (i) { return !i.read; }).length;
    var responded = allInquiries.filter(function (i) { return Boolean(i.responded); }).length;
    var read = allInquiries.filter(function (i) { return Boolean(i.read) && !i.responded; }).length;

    var countAll = document.getElementById('count-all');
    var countUnread = document.getElementById('count-unread');
    var countRead = document.getElementById('count-read');
    var countResponded = document.getElementById('count-responded');
    var headerBadge = document.getElementById('header-unread-badge');

    if (countAll) countAll.textContent = total;
    if (countUnread) countUnread.textContent = unread;
    if (countRead) countRead.textContent = read;
    if (countResponded) countResponded.textContent = responded;

    if (headerBadge) {
      if (unread > 0) {
        headerBadge.textContent = unread + (unread === 1 ? ' no leída' : ' no leídas');
        headerBadge.style.display = 'inline-flex';
      } else {
        headerBadge.textContent = 'Al día (0 no leídas)';
        headerBadge.className = 'badge badge--disponible';
      }
    }

    if (typeof updateSidebarUnreadCount === 'function') {
      updateSidebarUnreadCount();
    }
  }

  // Render inquiries list
  function renderInquiries(inquiries) {
    var container = document.getElementById('inquiries-list');
    var emptyState = document.getElementById('inquiries-empty');

    if (!container) return;

    if (!inquiries || inquiries.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    var html = '';
    inquiries.forEach(function (inq) {
      var isUnread = !inq.read;
      var isResponded = Boolean(inq.responded);
      var type = inq.type || 'general';

      var cardModifier = isUnread ? 'admin-inquiry--unread' : (isResponded ? 'admin-inquiry--responded' : 'admin-inquiry--read');
      var name = safeEscape(inq.name || 'Cliente');
      var phone = safeEscape(inq.phone || '');
      var email = safeEscape(inq.email || '');
      var message = safeEscape(inq.message || '');
      var vehicleName = safeEscape(inq.vehicleName || '');
      var vehicleId = inq.vehicleId || '';
      var timeAgoStr = safeTimeAgo(inq.createdAt);

      var typeBadgeLabel = 'General';
      var typeBadgeClass = 'badge--auto';
      if (type === 'vehiculo') {
        typeBadgeLabel = 'Vehículo';
        typeBadgeClass = 'badge--info';
      } else if (type === 'tasacion') {
        typeBadgeLabel = 'Tasación';
        typeBadgeClass = 'badge--reservado';
      }

      html += '<article class="admin-inquiry ' + cardModifier + '" id="inquiry-' + inq.id + '" data-id="' + inq.id + '">';

      // Card Header
      html += '  <div class="admin-inquiry__header" data-toggle-id="' + inq.id + '" role="button" tabindex="0" aria-expanded="false" aria-controls="inquiry-body-' + inq.id + '">';
      html += '    <div class="admin-inquiry__header-left">';
      html += '      <span class="admin-inquiry__unread-dot' + (isUnread ? '' : ' is-hidden') + '" title="Mensaje no leído"></span>';
      html += '      <div class="admin-inquiry__title-group">';
      html += '        <h3 class="admin-inquiry__name">' + name;
      html += '          <span class="badge ' + typeBadgeClass + '" style="font-size: 0.65rem; padding: 2px 6px;">' + typeBadgeLabel + '</span>';
      if (isResponded) {
        html += '          <span class="badge badge--disponible" style="font-size: 0.65rem; padding: 2px 6px;">Respondida</span>';
      }
      html += '        </h3>';
      html += '        <div class="admin-inquiry__meta">';
      html += '          <span>📅 ' + timeAgoStr + '</span>';
      if (phone) {
        html += '          <span>📱 ' + phone + '</span>';
      }
      if (vehicleName) {
        html += '          <span>🚗 ' + vehicleName + '</span>';
      }
      html += '        </div>';
      html += '      </div>';
      html += '    </div>';

      html += '    <div class="admin-inquiry__header-right">';
      html += '      <svg class="admin-inquiry__chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
      html += '    </div>';
      html += '  </div>';

      // Card Body
      html += '  <div class="admin-inquiry__body" id="inquiry-body-' + inq.id + '">';
      html += '    <div class="admin-inquiry__grid">';

      // Contact Details
      html += '      <div class="admin-inquiry__field">';
      html += '        <span class="admin-inquiry__field-label">Teléfono / WhatsApp</span>';
      html += '        <span class="admin-inquiry__field-value">';
      if (phone) {
        html += '          <a href="tel:' + phone + '">' + phone + '</a>';
      } else {
        html += '          <span class="text-muted">No especificado</span>';
      }
      html += '        </span>';
      html += '      </div>';

      html += '      <div class="admin-inquiry__field">';
      html += '        <span class="admin-inquiry__field-label">Correo Electrónico</span>';
      html += '        <span class="admin-inquiry__field-value">';
      if (email) {
        html += '          <a href="mailto:' + email + '">' + email + '</a>';
      } else {
        html += '          <span class="text-muted">No especificado</span>';
      }
      html += '        </span>';
      html += '      </div>';

      // Vehicle Link
      if (vehicleName) {
        html += '      <div class="admin-inquiry__field">';
        html += '        <span class="admin-inquiry__field-label">Vehículo de Interés</span>';
        html += '        <span class="admin-inquiry__field-value">';
        if (vehicleId) {
          html += '          <a href="../vehiculo.html?id=' + vehicleId + '" target="_blank" rel="noopener">🚗 ' + vehicleName + ' (Ver en el sitio)</a>';
        } else {
          html += '          <span>🚗 ' + vehicleName + '</span>';
        }
        html += '        </span>';
        html += '      </div>';
      }

      html += '    </div>';

      // Message
      html += '    <div class="admin-inquiry__message">';
      html += '      <strong style="display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--gray-500); margin-bottom: 0.35rem;">Mensaje del Cliente:</strong>';
      html += '      <p style="margin: 0; white-space: pre-wrap;">' + (message || 'Sin mensaje adicional.') + '</p>';
      html += '    </div>';

      // Actions
      html += '    <div class="admin-inquiry__actions">';

      // WhatsApp reply button
      if (phone) {
        var replyMsg = 'Hola ' + (inq.name || 'Cliente') + ', gracias por comunicarte con Concesionaria Kevin & Motos en Coronel Oviedo';
        if (vehicleName) {
          replyMsg += ' sobre ' + vehicleName;
        }
        replyMsg += '. ¿En qué podemos ayudarte?';

        var waUrl = safeWhatsAppLink(phone, replyMsg);
        html += '      <a href="' + waUrl + '" target="_blank" rel="noopener" class="btn btn--whatsapp btn--sm action-whatsapp" data-id="' + inq.id + '">';
        html += '        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
        html += '        <span>Responder por WhatsApp</span>';
        html += '      </a>';
      }

      // Mark responded button
      if (!isResponded) {
        html += '      <button type="button" class="btn btn--outline btn--sm action-mark-responded" data-id="' + inq.id + '">';
        html += '        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        html += '        <span>Marcar Respondida</span>';
        html += '      </button>';
      }

      // Delete button
      html += '      <button type="button" class="btn btn--secondary btn--sm action-delete-inquiry" data-id="' + inq.id + '" title="Eliminar consulta">';
      html += '        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      html += '        <span>Eliminar</span>';
      html += '      </button>';

      html += '    </div>';
      html += '  </div>';

      html += '</article>';
    });

    container.innerHTML = html;
    attachInquiryEventListeners();
  }

  // Attach card event listeners
  function attachInquiryEventListeners() {
    // Accordion Toggle
    var headers = document.querySelectorAll('.admin-inquiry__header');
    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        var cardId = this.getAttribute('data-toggle-id');
        var card = document.getElementById('inquiry-' + cardId);
        if (!card) return;

        var isOpen = card.classList.contains('is-open');
        if (isOpen) {
          card.classList.remove('is-open');
          this.setAttribute('aria-expanded', 'false');
        } else {
          card.classList.add('is-open');
          this.setAttribute('aria-expanded', 'true');

          // If not read yet, mark as read automatically
          var inq = allInquiries.find(function (item) { return item.id == cardId; });
          if (inq && !inq.read) {
            inq.read = true;
            if (typeof DB !== 'undefined' && typeof DB.markInquiryRead === 'function') {
              DB.markInquiryRead(cardId);
            }
            // Update visual state
            var dot = card.querySelector('.admin-inquiry__unread-dot');
            if (dot) dot.classList.add('is-hidden');
            if (!inq.responded) {
              card.classList.remove('admin-inquiry--unread');
              card.classList.add('admin-inquiry--read');
            }
            updateCounters();
          }
        }
      });
    });

    // Mark as Responded Buttons
    var respondBtns = document.querySelectorAll('.action-mark-responded');
    respondBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = this.getAttribute('data-id');
        markInquiryAsResponded(id);
      });
    });

    // WhatsApp action click (also marks as responded!)
    var waBtns = document.querySelectorAll('.action-whatsapp');
    waBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        markInquiryAsResponded(id, true);
      });
    });

    // Delete Buttons
    var deleteBtns = document.querySelectorAll('.action-delete-inquiry');
    deleteBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = this.getAttribute('data-id');
        openDeleteInquiryDialog(id);
      });
    });
  }

  function markInquiryAsResponded(id, isSilent) {
    if (typeof DB !== 'undefined') {
      if (typeof DB.markInquiryRead === 'function') DB.markInquiryRead(id);
      if (typeof DB.markInquiryResponded === 'function') DB.markInquiryResponded(id);
    }

    var inq = allInquiries.find(function (item) { return item.id == id; });
    if (inq) {
      inq.read = true;
      inq.responded = true;
    }

    applyCurrentFilters();
    updateCounters();

    if (!isSilent && typeof showToast === 'function') {
      showToast('Consulta marcada como respondida', 'success');
    }
  }

  // Delete Dialog Handling
  function openDeleteInquiryDialog(id) {
    inquiryToDeleteId = id;
    var dialog = document.getElementById('confirm-dialog');
    if (dialog) dialog.classList.add('active');
  }

  function closeDeleteInquiryDialog() {
    inquiryToDeleteId = null;
    var dialog = document.getElementById('confirm-dialog');
    if (dialog) dialog.classList.remove('active');
  }

  function setupDeleteConfirmHandlers() {
    var dialog = document.getElementById('confirm-dialog');
    var cancelBtn = document.getElementById('confirm-inquiry-cancel');
    var deleteBtn = document.getElementById('confirm-inquiry-delete');

    if (cancelBtn) cancelBtn.addEventListener('click', closeDeleteInquiryDialog);
    if (dialog) {
      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) closeDeleteInquiryDialog();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dialog && dialog.classList.contains('active')) {
        closeDeleteInquiryDialog();
      }
    });

    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        if (!inquiryToDeleteId) return;

        if (typeof DB !== 'undefined' && typeof DB.deleteInquiry === 'function') {
          DB.deleteInquiry(inquiryToDeleteId);
        }

        allInquiries = allInquiries.filter(function (item) { return item.id != inquiryToDeleteId; });
        closeDeleteInquiryDialog();
        applyCurrentFilters();
        updateCounters();

        if (typeof showToast === 'function') {
          showToast('Consulta eliminada', 'info');
        }
      });
    }
  }

  // Filter application
  function applyCurrentFilters() {
    var filtered = allInquiries.filter(function (item) {
      // Tab filter
      if (currentTab === 'unread' && item.read) return false;
      if (currentTab === 'read' && (!item.read || item.responded)) return false;
      if (currentTab === 'responded' && !item.responded) return false;

      // Type filter
      if (currentTypeFilter && (item.type || '').toLowerCase() !== currentTypeFilter.toLowerCase()) {
        return false;
      }

      return true;
    });

    renderInquiries(filtered);
  }

  // Initializer
  function init() {
    if (typeof DB !== 'undefined' && typeof DB.init === 'function') {
      DB.init();
    }

    if (typeof DB !== 'undefined' && typeof DB.getInquiries === 'function') {
      allInquiries = DB.getInquiries() || [];
    }

    // Sort newest first
    allInquiries.sort(function (a, b) {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    updateCounters();
    renderInquiries(allInquiries);
    setupDeleteConfirmHandlers();

    // Setup Tab Navigation
    var tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        this.classList.add('is-active');
        this.setAttribute('aria-selected', 'true');
        currentTab = this.getAttribute('data-tab');
        applyCurrentFilters();
      });
    });

    // Setup Type Filter
    var typeSelect = document.getElementById('inquiry-filter-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', function () {
        currentTypeFilter = this.value;
        applyCurrentFilters();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})();
