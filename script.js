'use strict';

/* ══════════════════════════════════════════════════════
   LOCALIZADOR — script.js
   ══════════════════════════════════════════════════════ */

// ── Config ────────────────────────────────────────────
// Troque para a URL do seu backend deployado
const API_BASE = (() => {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  // Substitua pela sua URL de produção
  return 'https://SEU-BACKEND.onrender.com/api';
})();

const NOMINATIM = 'https://nominatim.openstreetmap.org';

// ── State ─────────────────────────────────────────────
let currentResult = null; // location found by search
let editingId     = null; // id of location being edited
let savedLocations = [];  // cached list

// ── DOM refs ──────────────────────────────────────────
const inputLocal     = document.getElementById('inputLocal');
const btnBuscar      = document.getElementById('btnBuscar');
const btnGeo         = document.getElementById('btnGeo');
const resultado      = document.getElementById('resultado');
const listaSalvos    = document.getElementById('listasSalvos');
const salvosCount    = document.getElementById('salvosCount');
const modalOverlay   = document.getElementById('modalOverlay');
const modalLabel     = document.getElementById('modalLabel');
const modalNotes     = document.getElementById('modalNotes');
const btnModalCancel = document.getElementById('btnModalCancel');
const btnModalSave   = document.getElementById('btnModalSave');
const btnInstall     = document.getElementById('btnInstall');
const toastContainer = document.getElementById('toastContainer');

// ══════════════════════════════════════════════════════
// TABS
// ══════════════════════════════════════════════════════
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const panelId = btn.dataset.panel;

    // Update buttons
    document.querySelectorAll('.nav-btn').forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    // Update panels
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.hidden = true;
      p.classList.remove('active');
    });
    const panel = document.getElementById(`panel-${panelId}`);
    panel.hidden = false;
    panel.classList.add('active');

    // Load saved locations when switching to salvos
    if (panelId === 'salvos') loadSavedLocations();
  });
});

// Handle URL param ?tab=
const urlTab = new URLSearchParams(location.search).get('tab');
if (urlTab) {
  const tabBtn = document.querySelector(`[data-panel="${urlTab}"]`);
  if (tabBtn) tabBtn.click();
}

// ══════════════════════════════════════════════════════
// SEARCH
// ══════════════════════════════════════════════════════
btnBuscar.addEventListener('click', () => doSearch(inputLocal.value.trim()));

inputLocal.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch(inputLocal.value.trim());
});

async function doSearch(term) {
  if (!term) {
    showToast('Digite um nome para buscar', 'info');
    inputLocal.focus();
    return;
  }

  setLoadingState();

  try {
    const url = `${NOMINATIM}/search?format=json&limit=1&accept-language=pt-BR,pt&q=${encodeURIComponent(term)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Localizador-PWA/1.0' },
    });

    if (!res.ok) throw new Error('Erro na requisição');

    const data = await res.json();

    if (data.length === 0) {
      resultado.innerHTML = `<p class="status-msg">Nenhum lugar encontrado para "<strong>${escapeHtml(term)}</strong>"</p>`;
      currentResult = null;
      return;
    }

    currentResult = data[0];
    renderResultCard(currentResult);
  } catch (err) {
    console.error(err);
    resultado.innerHTML = `<p class="status-msg">Erro ao buscar. Verifique sua conexão.</p>`;
    currentResult = null;
  }
}

function setLoadingState() {
  resultado.innerHTML = `
    <div class="loading-state">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <span>Buscando coordenadas...</span>
    </div>`;
}

function renderResultCard(loc) {
  const googleLink = `https://www.google.com/maps?q=${loc.lat},${loc.lon}`;
  const shortName  = loc.display_name.split(',').slice(0, 3).join(',');

  resultado.innerHTML = `
    <div class="result-card">
      <div class="result-card-header">
        <div class="result-pin-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <p class="result-name">${escapeHtml(shortName)}</p>
      </div>

      <div class="result-coords">
        <div class="coord-item">
          <span class="coord-label">Latitude</span>
          <span class="coord-value">${parseFloat(loc.lat).toFixed(6)}</span>
        </div>
        <div class="coord-item">
          <span class="coord-label">Longitude</span>
          <span class="coord-value">${parseFloat(loc.lon).toFixed(6)}</span>
        </div>
      </div>

      <div class="result-save-row">
        <input
          type="text"
          class="save-input"
          id="saveLabelInput"
          placeholder="Nome para salvar..."
          value="${escapeHtml(shortName.split(',')[0])}"
          maxlength="80"
          aria-label="Nome do local para salvar"
        />
        <button class="btn-save-location" id="btnSaveLocation">
          Salvar
        </button>
      </div>

      <div class="result-maps-row">
        <a class="btn-maps" href="${googleLink}" target="_blank" rel="noopener noreferrer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Ver no Google Maps
        </a>
      </div>
    </div>`;

  document.getElementById('btnSaveLocation').addEventListener('click', () => {
    const label = document.getElementById('saveLabelInput').value.trim();
    if (!label) {
      showToast('Dê um nome ao local para salvar', 'info');
      return;
    }
    saveLocation(label, loc);
  });
}

// ══════════════════════════════════════════════════════
// GEOLOCATION (Hardware Feature — GPS)
// ══════════════════════════════════════════════════════
btnGeo.addEventListener('click', useGeolocation);

function useGeolocation() {
  if (!navigator.geolocation) {
    showToast('GPS não disponível neste dispositivo', 'error');
    return;
  }

  btnGeo.classList.add('loading');
  btnGeo.querySelector('.btn-geo-label').textContent = 'Obtendo localização...';
  btnGeo.disabled = true;

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon, accuracy } = pos.coords;

      // Reverse geocoding: coords → place name
      try {
        const url = `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=pt-BR,pt`;
        const res  = await fetch(url, { headers: { 'User-Agent': 'Localizador-PWA/1.0' } });
        const data = await res.json();

        currentResult = { lat: String(lat), lon: String(lon), display_name: data.display_name || 'Localização atual' };
        renderResultCard(currentResult);

        // Pre-fill save label
        const labelInput = document.getElementById('saveLabelInput');
        if (labelInput) {
          const city = data.address?.city || data.address?.town || data.address?.village || 'Minha Localização';
          labelInput.value = city;
        }

        showToast(`GPS preciso a ${Math.round(accuracy)}m`, 'success');
      } catch {
        // Even if reverse geocoding fails, show coords
        currentResult = { lat: String(lat), lon: String(lon), display_name: 'Localização atual' };
        renderResultCard(currentResult);
        showToast('Localização obtida (sem nome disponível)', 'info');
      }

      resetGeoBtn();
    },
    (err) => {
      resetGeoBtn();
      const msgs = {
        1: 'Permissão negada. Ative o GPS nas configurações.',
        2: 'Posição indisponível. Tente novamente.',
        3: 'Tempo esgotado ao buscar localização.',
      };
      showToast(msgs[err.code] || 'Erro ao acessar o GPS', 'error');
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}

function resetGeoBtn() {
  btnGeo.classList.remove('loading');
  btnGeo.querySelector('.btn-geo-label').textContent = 'Usar minha localização';
  btnGeo.disabled = false;
}

// ══════════════════════════════════════════════════════
// CRUD — CREATE
// ══════════════════════════════════════════════════════
async function saveLocation(label, loc) {
  const btn = document.getElementById('btnSaveLocation');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

  try {
    const res = await fetch(`${API_BASE}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label,
        display_name: loc.display_name,
        lat: loc.lat,
        lon: loc.lon,
        notes: '',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erro ao salvar');
    }

    const saved = await res.json();
    savedLocations.unshift(saved);
    updateSalvosCount();
    showToast(`"${label}" salvo com sucesso!`, 'success');

    if (btn) { btn.textContent = '✓ Salvo'; btn.style.background = 'var(--green)'; }
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Erro ao conectar com o servidor', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
  }
}

// ══════════════════════════════════════════════════════
// CRUD — READ
// ══════════════════════════════════════════════════════
async function loadSavedLocations() {
  listaSalvos.innerHTML = `
    <div class="loading-state">
      <div class="loading-dots"><span></span><span></span><span></span></div>
      <span>Carregando...</span>
    </div>`;

  try {
    const res  = await fetch(`${API_BASE}/locations`);
    if (!res.ok) throw new Error('Erro ao carregar');
    const data = await res.json();
    savedLocations = data;
    renderSavedList();
  } catch (err) {
    console.error(err);
    listaSalvos.innerHTML = `<p class="status-msg">Erro ao carregar locais. Verifique sua conexão.</p>`;
  }
}

function renderSavedList() {
  updateSalvosCount();

  if (savedLocations.length === 0) {
    listaSalvos.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <p>Nenhum local salvo ainda</p>
        <span>Busque um lugar e toque em "Salvar"</span>
      </div>`;
    return;
  }

  listaSalvos.innerHTML = savedLocations.map((loc) => renderSavedCard(loc)).join('');

  // Attach action listeners
  savedLocations.forEach((loc) => {
    document.getElementById(`edit-${loc._id}`)?.addEventListener('click', () => openEditModal(loc));
    document.getElementById(`del-${loc._id}`)?.addEventListener('click', () => deleteLocation(loc._id, loc.label));
  });
}

function renderSavedCard(loc) {
  const googleLink = `https://www.google.com/maps?q=${loc.lat},${loc.lon}`;
  const notesHtml  = loc.notes ? `<p class="saved-card-notes">${escapeHtml(loc.notes)}</p>` : '';

  return `
    <div class="saved-card" role="listitem" id="card-${loc._id}">
      <div class="saved-card-body">
        <div class="saved-card-pin" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="saved-card-info">
          <p class="saved-card-label">${escapeHtml(loc.label)}</p>
          <p class="saved-card-name">${escapeHtml(loc.display_name.split(',').slice(0,3).join(','))}</p>
          <div class="saved-card-coords">
            <span class="saved-coord-chip">${parseFloat(loc.lat).toFixed(5)}</span>
            <span class="saved-coord-chip">${parseFloat(loc.lon).toFixed(5)}</span>
          </div>
          ${notesHtml}
        </div>
      </div>
      <div class="saved-card-actions">
        <a class="saved-action-btn maps" href="${googleLink}" target="_blank" rel="noopener noreferrer" aria-label="Ver ${escapeHtml(loc.label)} no Google Maps">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          Mapa
        </a>
        <button class="saved-action-btn edit" id="edit-${loc._id}" aria-label="Editar ${escapeHtml(loc.label)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </button>
        <button class="saved-action-btn del" id="del-${loc._id}" aria-label="Remover ${escapeHtml(loc.label)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
          Remover
        </button>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════
// CRUD — UPDATE
// ══════════════════════════════════════════════════════
function openEditModal(loc) {
  editingId = loc._id;
  modalLabel.value = loc.label;
  modalNotes.value = loc.notes || '';
  modalOverlay.classList.add('open');
  modalOverlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => modalLabel.focus(), 100);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  modalOverlay.setAttribute('aria-hidden', 'true');
  editingId = null;
}

btnModalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
});

btnModalSave.addEventListener('click', async () => {
  const label = modalLabel.value.trim();
  const notes = modalNotes.value.trim();

  if (!label) {
    showToast('O nome não pode ficar vazio', 'info');
    modalLabel.focus();
    return;
  }

  btnModalSave.textContent = 'Salvando...';
  btnModalSave.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/locations/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, notes }),
    });

    if (!res.ok) throw new Error('Erro ao atualizar');

    const updated = await res.json();
    savedLocations = savedLocations.map((l) => (l._id === editingId ? updated : l));
    renderSavedList();
    closeModal();
    showToast('Local atualizado!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Erro ao atualizar. Tente novamente.', 'error');
  } finally {
    btnModalSave.textContent = 'Salvar';
    btnModalSave.disabled = false;
  }
});

// ══════════════════════════════════════════════════════
// CRUD — DELETE
// ══════════════════════════════════════════════════════
async function deleteLocation(id, label) {
  // Animate card out
  const card = document.getElementById(`card-${id}`);
  if (card) { card.style.opacity = '0.4'; card.style.pointerEvents = 'none'; }

  try {
    const res = await fetch(`${API_BASE}/locations/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao remover');

    savedLocations = savedLocations.filter((l) => l._id !== id);
    renderSavedList();
    showToast(`"${label}" removido`, 'info');
  } catch (err) {
    console.error(err);
    if (card) { card.style.opacity = '1'; card.style.pointerEvents = 'all'; }
    showToast('Erro ao remover. Tente novamente.', 'error');
  }
}

// ══════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════
function updateSalvosCount() {
  const count = savedLocations.length;
  salvosCount.textContent = count;

  // Badge on nav
  let badge = document.querySelector('#tab-salvos .nav-badge');
  if (!badge) {
    const icon = document.querySelector('#tab-salvos .nav-btn-icon');
    badge = document.createElement('span');
    badge.className = 'nav-badge';
    badge.setAttribute('aria-hidden', 'true');
    icon.appendChild(badge);
  }
  badge.textContent = count > 9 ? '9+' : count;
  badge.classList.toggle('show', count > 0);
}

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span class="toast-dot" aria-hidden="true"></span> ${escapeHtml(msg)}`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════════════════
// PWA — Service Worker + Install Prompt
// ══════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => console.log('✅ SW registrado:', reg.scope))
      .catch((err) => console.warn('SW não registrado:', err));
  });
}

// A2HS (Add to Home Screen) install prompt
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  btnInstall.hidden = false;
});

btnInstall.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    showToast('App instalado com sucesso!', 'success');
    btnInstall.hidden = true;
  }
  deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
  btnInstall.hidden = true;
  deferredPrompt = null;
});
