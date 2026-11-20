/**
 * Image Handler — Compress, Resize & Convert to WebP
 * Panel de Gestión — Concesionaria Esteban
 */

import { requireSupabase, SUPABASE_CONFIG, IMAGES_BUCKET, IMAGE_MAX_WIDTH, IMAGE_MAX_HEIGHT, IMAGE_QUALITY } from '../supabase-client.js';

// ─── Compress + Convert to WebP ───────────────────────────────────────────────
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Scale down if too large
      if (width > IMAGE_MAX_WIDTH || height > IMAGE_MAX_HEIGHT) {
        const ratio = Math.min(IMAGE_MAX_WIDTH / width, IMAGE_MAX_HEIGHT / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/webp',
        IMAGE_QUALITY
      );
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
}

// ─── Upload single image to Supabase Storage ─────────────────────────────────
export async function uploadImage(file, vehicleId) {
  const compressed = await compressImage(file);
  const ext        = 'webp';
  const filename   = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path       = `${vehicleId}/${filename}`;

  const client = requireSupabase();
  const { error } = await client.storage
    .from(IMAGES_BUCKET)
    .upload(path, compressed, { contentType: 'image/webp', upsert: false });

  if (error) throw error;

  const { data } = client.storage.from(IMAGES_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// ─── Delete image from Supabase Storage ───────────────────────────────────────
export async function deleteImage(path) {
  try {
    const { error } = await requireSupabase().storage.from(IMAGES_BUCKET).remove([path]);
    if (error) console.warn('Could not delete image:', error.message);
  } catch (err) {
    console.warn('Could not delete image:', err.message);
  }
}

// ─── Drag & Drop UI ──────────────────────────────────────────────────────────
export function initImageDropzone({ dropzoneEl, previewEl, onFilesAdded }) {
  if (!dropzoneEl) return;

  // Click to open file picker
  dropzoneEl.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type     = 'file';
    input.accept   = 'image/*';
    input.multiple = true;
    input.onchange = e => onFilesAdded([...e.target.files]);
    input.click();
  });

  // Drag & drop
  dropzoneEl.addEventListener('dragover', e => {
    e.preventDefault();
    dropzoneEl.classList.add('dropzone--over');
  });
  dropzoneEl.addEventListener('dragleave', () => dropzoneEl.classList.remove('dropzone--over'));
  dropzoneEl.addEventListener('drop', e => {
    e.preventDefault();
    dropzoneEl.classList.remove('dropzone--over');
    const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
    if (files.length) onFilesAdded(files);
  });
}

// ─── Render image previews ────────────────────────────────────────────────────
export function renderImagePreviews({ images, previewEl, onRemove, onSetPrimary, onReorder }) {
  if (!previewEl) return;
  previewEl.innerHTML = '';

  images.forEach((img, idx) => {
    const card = document.createElement('div');
    card.className = `img-preview-card${img.isPrimary ? ' img-preview-card--primary' : ''}`;
    card.draggable = true;
    card.dataset.idx = idx;

    const image = document.createElement('img');
    image.alt = `Vista previa ${idx + 1}`;
    image.loading = 'lazy';
    // Only render trusted HTTPS image locations; never interpolate database data into HTML.
    try {
      const url = new URL(String(img.url || ''), window.location.href);
      const storageHost = SUPABASE_CONFIG.url ? new URL(SUPABASE_CONFIG.url).hostname : '';
      if (url.protocol === 'https:' && (url.hostname === storageHost || url.origin === window.location.origin)) {
        image.src = url.href;
      }
    } catch { /* leave preview source empty for malformed URLs */ }

    card.innerHTML = `
      ${img.isPrimary ? '<span class="img-badge">Principal</span>' : ''}
      <div class="img-preview-actions">
        ${!img.isPrimary ? `<button type="button" class="btn-img-action btn-img-primary" title="Hacer principal">⭐</button>` : ''}
        <button type="button" class="btn-img-action btn-img-delete" title="Eliminar">🗑</button>
      </div>
    `;
    card.prepend(image);

    // Set primary
    card.querySelector('.btn-img-primary')?.addEventListener('click', e => {
      e.stopPropagation();
      onSetPrimary(idx);
    });

    // Delete
    card.querySelector('.btn-img-delete').addEventListener('click', e => {
      e.stopPropagation();
      onRemove(idx);
    });

    // Drag reorder
    card.addEventListener('dragstart', e => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', idx);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', e => { e.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', e => {
      e.preventDefault();
      card.classList.remove('drag-over');
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
      if (fromIdx !== idx) onReorder(fromIdx, idx);
    });

    previewEl.appendChild(card);
  });
}
