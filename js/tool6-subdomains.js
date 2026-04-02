/* ─── TOOL 6 — SUBDOMAIN RECON ─── */
const WORKER_URL = 'https://sectools-headers.draeneills.workers.dev';

async function scanSubdomains() {
  const input    = document.getElementById('sub-domain').value.trim().toLowerCase();
  const resultDiv = document.getElementById('sub-result');

  if (!input) {
    const inp = document.getElementById('sub-domain');
    inp.style.animation = 'none';
    inp.offsetHeight;
    inp.style.animation = 'inputShake 0.35s ease';
    return;
  }

  const domain = input.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  resultDiv.classList.remove('hidden');
  resultDiv.innerHTML = `
    <div class="result-item" style="border-left:3px solid var(--accent);margin-bottom:12px">
      <div class="hx-spinner"></div>
      <div style="flex:1">
        <div class="label" style="font-family:var(--font-mono)">Querying passive sources for <strong>${domain}</strong></div>
        <div id="sub-status" class="detail" style="font-family:var(--font-mono)">Connecting to crt.sh &amp; HackerTarget...</div>
      </div>
    </div>
    <div class="hx-progress-track" style="margin-bottom:16px">
      <div class="hx-progress-bar hx-indeterminate"></div>
    </div>
    ${[60,45,75,55,80].map(w => `
    <div class="result-item hx-skeleton-row">
      <div class="hx-skeleton" style="width:14px;height:14px;border-radius:50%;flex-shrink:0"></div>
      <div style="flex:1"><div class="hx-skeleton" style="width:${w}%;height:11px;border-radius:3px"></div></div>
      <div class="hx-skeleton" style="width:44px;height:22px;border-radius:4px"></div>
    </div>`).join('')}
  `;

  let response;
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 15000);

    response = await fetch(
      `${WORKER_URL}/?action=subdomains&domain=${encodeURIComponent(domain)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const e = classifyFetchError(null, response);
      showErrorBanner(resultDiv, e.message, e);
      return;
    }

    const data = await response.json();

    if (data.error) {
      // Detectar rate limit en el mensaje de la API
      const isRate = /rate.?limit|too many|429/i.test(data.error);
      showErrorBanner(
        resultDiv,
        isRate ? 'API rate limit reached. Try again in 60s.' : data.error,
        isRate ? { type: 'warn', countdown: 60 } : { type: 'error' }
      );
      return;
    }

    _renderSubdomains(resultDiv, domain, data);

  } catch (err) {
    const e = classifyFetchError(err, response);
    showErrorBanner(resultDiv, e.message, e);
  }
}

/* ─── Render resultados ───────────────────────────────────────────────────── */
function _renderSubdomains(resultDiv, domain, data) {
  const subdomains = data.subdomains || [];
  const sources    = data.sources    || [];
  const total      = data.total      || subdomains.length;

  resultDiv.innerHTML = '';

  if (total === 0) {
    showErrorBanner(
      resultDiv,
      `No subdomains found for <strong>${domain}</strong>. Try a larger domain or verify the target.`,
      { type: 'warn' }
    );
    return;
  }

  // Guardar globalmente para export y filtro
  window._lastSubdomains = subdomains;
  window._lastSubdomain  = domain;

  // ── Summary bar ──
  const summary = document.createElement('div');
  summary.className = 'result-item pass';
  summary.style.cssText = 'margin-bottom:8px;border-width:2px;flex-wrap:wrap;gap:8px';
  summary.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--green)" style="width:20px;height:20px;flex-shrink:0">
      <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/>
    </svg>
    <div style="flex:1;min-width:160px">
      <div class="label" style="font-size:0.95rem">
        Found <strong>${total}</strong> subdomains for <span style="color:var(--accent);font-family:var(--font-mono)">${domain}</span>
      </div>
      <div class="detail">Sources: ${sources.join(' + ')} · Passive recon only</div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="copy-btn" onclick="_copySubdomains()" title="Copy all to clipboard">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;vertical-align:middle;margin-right:3px">
          <path fill-rule="evenodd" d="M11.986 3H12a2 2 0 0 1 2 2v6a2 2 0 0 1-1.5 1.937V7A2.5 2.5 0 0 0 10 4.5H4.063A2 2 0 0 1 6 3h.014A2.25 2.25 0 0 1 8.25 1h1.5a2.25 2.25 0 0 1 2.236 2ZM10.5 4v-.175a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75V4h3Z" clip-rule="evenodd"/>
          <path d="M3 6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H3Z"/>
        </svg>
        Copy all
      </button>
      <button class="copy-btn" onclick="_exportSubdomains('txt')" title="Export as TXT">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;vertical-align:middle;margin-right:3px">
          <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h5.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V12.5A1.5 1.5 0 0 1 11.5 14h-8A1.5 1.5 0 0 1 2 12.5v-9Z"/>
        </svg>
        TXT
      </button>
      <button class="copy-btn" onclick="_exportSubdomains('json')" title="Export as JSON">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px;vertical-align:middle;margin-right:3px">
          <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h5.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V12.5A1.5 1.5 0 0 1 11.5 14h-8A1.5 1.5 0 0 1 2 12.5v-9Z"/>
        </svg>
        JSON
      </button>
    </div>
  `;
  resultDiv.appendChild(summary);

  // ── Filtro en tiempo real ──
  const filterWrap = document.createElement('div');
  filterWrap.style.cssText = 'position:relative;margin-bottom:10px';
  filterWrap.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
      style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--text-muted);pointer-events:none">
      <path d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"/>
    </svg>
    <input
      id="sub-filter"
      type="text"
      class="text-input"
      placeholder="Filter results... (e.g. api, dev, staging)"
      style="padding-left:32px;font-size:0.82rem"
      oninput="_filterSubdomains(this.value)"
    />
    <span id="sub-filter-count" style="
      position:absolute;right:10px;top:50%;transform:translateY(-50%);
      font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);
      pointer-events:none
    ">${total}</span>
  `;
  resultDiv.appendChild(filterWrap);

  // ── Progress completado ──
  const progressDone = document.createElement('div');
  progressDone.className = 'hx-progress-track';
  progressDone.style.marginBottom = '10px';
  progressDone.innerHTML = '<div class="hx-progress-bar" style="width:100%;background:var(--green);transition:none"></div>';
  resultDiv.appendChild(progressDone);

  // ── Lista de subdominios ──
  const list = document.createElement('div');
  list.id = 'sub-list';
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '5px';
  resultDiv.appendChild(list);

  _renderSubList(subdomains);
}

/* ─── Renderiza los items de la lista ────────────────────────────────────── */
function _renderSubList(subs) {
  const list = document.getElementById('sub-list');
  if (!list) return;
  list.innerHTML = '';

  if (subs.length === 0) {
    list.innerHTML = `
      <div class="result-item warn" style="font-family:var(--font-mono);font-size:0.82rem">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--yellow)" style="width:16px;height:16px;flex-shrink:0">
          <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" clip-rule="evenodd"/>
        </svg>
        No results match your filter.
      </div>`;
    return;
  }

  subs.forEach(sub => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.style.borderLeft = '3px solid rgba(34,211,238,0.35)';
    item.style.padding    = '8px 14px';
    item.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--accent)" style="width:14px;height:14px;flex-shrink:0;margin-top:1px">
        <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM4.332 8.027a6.012 6.012 0 0 1 1.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 0 1 9 7.5V8a2 2 0 0 0 2 2h.5a.5.5 0 0 1 .5.5v.75a.75.75 0 0 0 1.5 0v-1.5a3 3 0 0 0-3-3h-.51l-.103-.309a.75.75 0 0 0-1.422.474l.104.312a1.506 1.506 0 0 0-.618.307 3.008 3.008 0 0 0-1.031 4.333 1.5 1.5 0 0 1-.812 2.277 6.017 6.017 0 0 1-3.39-3.827Zm11.42 2.09a6.018 6.018 0 0 1-4.723 5.38 1.5 1.5 0 0 0-.814-1.247A3.507 3.507 0 0 0 9.013 11.2l-.119-.356a.5.5 0 0 1 .447-.644l.386-.023a1.5 1.5 0 0 0 1.274-.83l.209-.398a.5.5 0 0 1 .69-.213l.471.255a3 3 0 0 0 3.888-1.126l.062-.1a6.029 6.029 0 0 1 .43 2.352Z" clip-rule="evenodd"/>
      </svg>
      <div style="flex:1">
        <div class="label" style="font-family:var(--font-mono);font-size:0.83rem;font-weight:500">${sub}</div>
      </div>
      <a href="https://${sub}" target="_blank" rel="noopener noreferrer"
        class="copy-btn" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width:11px;height:11px">
          <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z"/>
          <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z"/>
        </svg>
        Visit
      </a>
    `;
    list.appendChild(item);
  });
}

/* ─── Filtro en tiempo real ───────────────────────────────────────────────── */
function _filterSubdomains(query) {
  const all      = window._lastSubdomains || [];
  const filtered = query.trim()
    ? all.filter(s => s.toLowerCase().includes(query.trim().toLowerCase()))
    : all;

  const countEl = document.getElementById('sub-filter-count');
  if (countEl) countEl.textContent = filtered.length + ' / ' + all.length;

  _renderSubList(filtered);
}

/* ─── Copiar al portapapeles ──────────────────────────────────────────────── */
function _copySubdomains() {
  const subs = window._lastSubdomains;
  if (!subs || !subs.length) return;
  navigator.clipboard.writeText(subs.join('\n')).then(() => {
    showToast('Copied ' + subs.length + ' subdomains!');
  });
}

// Mantener compatibilidad con el botón antiguo
function copySubdomains() { _copySubdomains(); }

/* ─── Export TXT / JSON ───────────────────────────────────────────────────── */
function _exportSubdomains(format) {
  const subs   = window._lastSubdomains || [];
  const domain = window._lastSubdomain  || 'subdomains';
  if (!subs.length) return;

  let content, mime, ext;

  if (format === 'json') {
    content = JSON.stringify({
      domain,
      total: subs.length,
      exported_at: new Date().toISOString(),
      subdomains: subs,
    }, null, 2);
    mime = 'application/json';
    ext  = 'json';
  } else {
    content = `# HexScan — Subdomain Recon\n# Domain: ${domain}\n# Total: ${subs.length}\n# Exported: ${new Date().toISOString()}\n\n` + subs.join('\n');
    mime = 'text/plain';
    ext  = 'txt';
  }

  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${domain}-subdomains.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported as ' + ext.toUpperCase() + '!');
}
