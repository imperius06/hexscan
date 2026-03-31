/* ─── TOOL 6 — SUBDOMAIN RECON ─── */
async function scanSubdomains() {
  const input = document.getElementById('sub-domain').value.trim().toLowerCase();
  const resultDiv = document.getElementById('sub-result');

  if (!input) {
    const inp = document.getElementById('sub-domain');
    inp.style.animation = 'none';
    inp.offsetHeight;
    inp.style.animation = 'inputShake 0.35s ease';
    return;
  }

  const domain = input.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  // ── LOADING STATE — skeleton ──
  resultDiv.classList.remove('hidden');
  resultDiv.innerHTML = `
    <div class="result-item" style="border-left:3px solid var(--accent);margin-bottom:12px">
      <div class="hx-spinner"></div>
      <div style="flex:1">
        <div class="label" style="font-family:var(--font-mono)">Querying passive sources for <strong>${domain}</strong></div>
        <div id="sub-status" class="detail" style="font-family:var(--font-mono)">Connecting to crt.sh...</div>
      </div>
    </div>
    <div class="hx-progress-track" style="margin-bottom:16px"><div class="hx-progress-bar hx-indeterminate"></div></div>
    ${[...Array(4)].map(() => `
      <div class="result-item hx-skeleton-row">
        <div class="hx-skeleton" style="width:14px;height:14px;border-radius:50%;flex-shrink:0"></div>
        <div style="flex:1;display:flex;flex-direction:column;gap:5px">
          <div class="hx-skeleton" style="width:${55 + Math.floor(Math.random()*30)}%;height:11px;border-radius:3px"></div>
        </div>
        <div class="hx-skeleton" style="width:44px;height:22px;border-radius:4px"></div>
      </div>
    `).join('')}
  `;

  const setStatus = (msg) => {
    const el = document.getElementById('sub-status');
    if (el) el.textContent = msg;
  };

  const found = new Set();
  const errors = [];

  // ── SOURCE 1: crt.sh ──
  setStatus('Querying crt.sh certificate logs...');
  try {
    const res = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://crt.sh/?q=%25.' + domain + '&output=json'));
    const data = await res.json();
    data.forEach(function(entry) {
      const names = entry.name_value.split('\n');
      names.forEach(function(name) {
        name = name.trim().toLowerCase();
        if (name.endsWith('.' + domain) || name === domain) {
          found.add(name.replace(/^\*\./, ''));
        }
      });
    });
    setStatus(`crt.sh done — ${found.size} found. Querying HackerTarget...`);
  } catch(e) {
    errors.push('crt.sh');
    setStatus('crt.sh unavailable. Querying HackerTarget...');
  }

  // ── SOURCE 2: HackerTarget ──
  try {
    const res2 = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://api.hackertarget.com/hostsearch/?q=' + domain));
    const text = await res2.text();
    if (!text.includes('error') && !text.includes('API count')) {
      text.split('\n').forEach(function(line) {
        const parts = line.split(',');
        if (parts[0]) found.add(parts[0].trim().toLowerCase());
      });
    }
  } catch(e) {
    errors.push('HackerTarget');
  }

  // ── RENDER RESULTS ──
  resultDiv.innerHTML = '';

  if (found.size === 0) {
    resultDiv.innerHTML = `
      <div class="result-item warn">
        <span>⚠️</span>
        <div>
          <div class="label">No subdomains found for ${domain}</div>
          <div class="detail">Try with a larger domain or verify the target is correct.</div>
        </div>
      </div>`;
    return;
  }

  const sorted = Array.from(found).sort();
  window._lastSubdomains = sorted;

  const sources = [
    !errors.includes('crt.sh') ? 'crt.sh' : null,
    !errors.includes('HackerTarget') ? 'HackerTarget' : null
  ].filter(Boolean).join(' + ');

  // Summary card
  const summary = document.createElement('div');
  summary.className = 'result-item pass';
  summary.style.cssText = 'margin-bottom:12px;border-width:2px';
  summary.innerHTML = `
    <span style="font-size:1.4rem">🎯</span>
    <div style="flex:1">
      <div class="label" style="font-size:1rem">Found <strong>${sorted.length}</strong> subdomains for ${domain}</div>
      <div class="detail">Sources: ${sources} · Passive recon only · No direct probing</div>
    </div>
    <button class="copy-btn" onclick="copySubdomains()">Copy all</button>
  `;
  resultDiv.appendChild(summary);

  // Barra de progreso final completada
  const progressDone = document.createElement('div');
  progressDone.className = 'hx-progress-track';
  progressDone.style.marginBottom = '12px';
  progressDone.innerHTML = `<div class="hx-progress-bar" style="width:100%;transition:width 0.4s ease;background:var(--green)"></div>`;
  resultDiv.appendChild(progressDone);

  // Lista
  sorted.forEach(function(sub) {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.style.borderLeft = '3px solid var(--accent)';
    item.innerHTML = `
      <span style="font-size:0.9rem;color:var(--accent)">◆</span>
      <div style="flex:1">
        <div class="label" style="font-family:var(--font-mono);font-size:0.85rem">${sub}</div>
      </div>
      <a href="https://${sub}" target="_blank" class="copy-btn" style="text-decoration:none">Visit ↗</a>
    `;
    resultDiv.appendChild(item);
  });
}

function copySubdomains() {
  if (window._lastSubdomains) {
    navigator.clipboard.writeText(window._lastSubdomains.join('\n')).then(function() {
      showToast('Copied ' + window._lastSubdomains.length + ' subdomains!');
    });
  }
}
