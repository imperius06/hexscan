/* ─────────────────────────────────────────
   HexScan — main.js
   Shared utilities used by all tools.
   ───────────────────────────────────────── */

function copyText(elementId) {
  const el = document.getElementById(elementId);
  const text = el.textContent || el.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied!');
    const btn = el.closest('.output-box')?.querySelector('.copy-btn');
    if (btn) {
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1800);
    }
  });
}

function showToast(msg = 'Copied!') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function switchTab(btn, panelId) {
  const card = btn.closest('.tool-body');
  card.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  card.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}

function showResult(el, type, msg) {
  el.className = 'result-box';
  if (type) el.classList.add(type);
  el.classList.remove('hidden');
  el.style.whiteSpace = 'pre-wrap';
  el.textContent = msg;
}

/* ─── ERROR BANNER ───────────────────────────────────────────────────────────
   Uso:
     showErrorBanner(container, 'API Timeout. Try again in 60s.')
     showErrorBanner(container, 'Rate limited', { type: 'warn', countdown: 60 })

   type     : 'error' | 'warn' | 'info'   (default: 'error')
   countdown: segundos de countdown        (default: 0 = sin countdown)
   prepend  : true = inserta arriba        (default: false = reemplaza contenido)
────────────────────────────────────────────────────────────────────────────── */
function showErrorBanner(container, message, { type = 'error', countdown = 0, prepend = false } = {}) {
  const colors = {
    error: { border: 'var(--red)',    bg: 'rgba(244,63,94,0.07)',   icon: _iconX() },
    warn:  { border: 'var(--yellow)', bg: 'rgba(245,158,11,0.07)',  icon: _iconWarn() },
    info:  { border: 'var(--accent)', bg: 'rgba(34,211,238,0.07)',  icon: _iconInfo() },
  };
  const c = colors[type] || colors.error;

  const bannerId = 'hx-banner-' + Math.random().toString(36).slice(2, 7);
  const cdId     = 'hx-cd-' + bannerId;

  const banner = document.createElement('div');
  banner.id = bannerId;
  banner.style.cssText = `
    display:flex;align-items:flex-start;gap:12px;
    padding:12px 16px;border-radius:6px;
    border:1px solid ${c.border};
    border-left:3px solid ${c.border};
    background:${c.bg};
    margin-bottom:12px;
    font-family:var(--font-mono);
    font-size:0.83rem;
    animation: fadeDown 0.25s ease both;
  `;

  banner.innerHTML = `
    <span style="flex-shrink:0;margin-top:1px">${c.icon}</span>
    <div style="flex:1;line-height:1.5">
      <span style="color:var(--text)">${message}</span>
      ${countdown > 0
        ? `<span id="${cdId}" style="color:var(--text-muted);margin-left:8px">· retry in <strong>${countdown}s</strong></span>`
        : ''}
    </div>
    <button onclick="document.getElementById('${bannerId}').remove()"
      style="background:transparent;border:none;cursor:pointer;color:var(--text-muted);
             font-size:1rem;line-height:1;padding:0;flex-shrink:0;margin-top:-1px"
      title="Dismiss">
      ${_iconClose()}
    </button>
  `;

  container.classList.remove('hidden');

  if (prepend) {
    container.insertBefore(banner, container.firstChild);
  } else {
    container.innerHTML = '';
    container.appendChild(banner);
  }

  // Countdown timer
  if (countdown > 0) {
    let secs = countdown;
    const timer = setInterval(() => {
      secs--;
      const cdEl = document.getElementById(cdId);
      if (!cdEl) { clearInterval(timer); return; }
      if (secs <= 0) {
        cdEl.remove();
        clearInterval(timer);
      } else {
        cdEl.innerHTML = `· retry in <strong>${secs}s</strong>`;
      }
    }, 1000);
  }

  return banner;
}

/* ─── Clasificar error de fetch ──────────────────────────────────────────────
   Devuelve { message, type, countdown } listos para showErrorBanner.
   Uso:  const e = classifyFetchError(err, response);
         showErrorBanner(container, e.message, e);
────────────────────────────────────────────────────────────────────────────── */
function classifyFetchError(err, response = null) {
  if (response) {
    if (response.status === 429) return { message: 'Rate limited by API. Try again in 60s.', type: 'warn', countdown: 60 };
    if (response.status === 404) return { message: 'Resource not found (404). The target may not exist.', type: 'warn', countdown: 0 };
    if (response.status === 403) return { message: 'Access forbidden (403). The target blocks automated requests.', type: 'warn', countdown: 0 };
    if (response.status === 500) return { message: 'Remote server error (500). Try again in a moment.', type: 'error', countdown: 30 };
    if (response.status === 503) return { message: 'Service unavailable (503). API may be down.', type: 'error', countdown: 60 };
    if (response.status >= 400) return { message: `HTTP ${response.status} error from API.`, type: 'error', countdown: 0 };
  }
  if (err?.name === 'AbortError') return { message: 'Request timed out. The target took too long to respond.', type: 'warn', countdown: 0 };
  if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
    return { message: 'Network error. Check your connection or the Worker may be offline.', type: 'error', countdown: 0 };
  }
  return { message: 'Unexpected error: ' + (err?.message || 'Unknown'), type: 'error', countdown: 0 };
}

/* ─── SVG icons inline (heroicons, 16px) ─────────────────────────────────── */
function _iconX() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--red)" style="width:16px;height:16px">
    <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clip-rule="evenodd"/>
  </svg>`;
}
function _iconWarn() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--yellow)" style="width:16px;height:16px">
    <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" clip-rule="evenodd"/>
  </svg>`;
}
function _iconInfo() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--accent)" style="width:16px;height:16px">
    <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clip-rule="evenodd"/>
  </svg>`;
}
function _iconClose() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style="width:14px;height:14px">
    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/>
  </svg>`;
}

/* ─── INIT ──────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  generatePassword();
});
