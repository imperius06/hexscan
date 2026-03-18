// ─────────────────────────────────────────
// TOOL 6 — SUBDOMAIN RECON
// ─────────────────────────────────────────

async function scanSubdomains() {
  const input = document.getElementById('sub-domain').value.trim().toLowerCase();
  const resultDiv = document.getElementById('sub-result');

  if (!input) return;

  // Limpia protocolo si lo pegan con https://
  const domain = input.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  resultDiv.innerHTML = '<div class="result-item warn"><span>🔍</span><div class="label">Scanning ' + domain + '...</div></div>';
  resultDiv.classList.remove('hidden');

  const found = new Set();
  const errors = [];

  // ── SOURCE 1: crt.sh (certificados SSL) ──
  try {
    const res = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://crt.sh/?q=%25.' + domain + '&output=json'));
    const data = await res.json();
    data.forEach(function(entry) {
      const names = entry.name_value.split('\n');
      names.forEach(function(name) {
        name = name.trim().toLowerCase();
        if (name.endsWith('.' + domain) || name === domain) {
          // Remove wildcard prefix
          found.add(name.replace(/^\*\./, ''));
        }
      });
    });
  } catch(e) {
    errors.push('crt.sh');
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
    resultDiv.innerHTML = '<div class="result-item warn"><span>⚠️</span><div class="label">No subdomains found for ' + domain + '</div></div>';
    return;
  }

  // Sort subdomains
  const sorted = Array.from(found).sort();

  // Summary
  const summary = document.createElement('div');
  summary.className = 'result-item pass';
  summary.style.cssText = 'margin-bottom:12px; border-width:2px;';
  summary.innerHTML =
    '<span style="font-size:1.5rem">🎯</span>' +
    '<div>' +
      '<div class="label" style="font-size:1rem">Found ' + sorted.length + ' subdomains for ' + domain + '</div>' +
      '<div class="detail">Sources: crt.sh' + (errors.includes('HackerTarget') ? '' : ' + HackerTarget') + ' · Passive recon only</div>' +
    '</div>' +
    '<button class="copy-btn" onclick="copySubdomains()">Copy all</button>';
  resultDiv.appendChild(summary);

  // Store for copy
  window._lastSubdomains = sorted;

  // List
  sorted.forEach(function(sub) {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.style.borderLeft = '3px solid var(--accent)';
    item.innerHTML =
      '<span style="font-size:0.9rem">🔗</span>' +
      '<div style="flex:1">' +
        '<div class="label" style="font-family:var(--font-mono);font-size:0.85rem">' + sub + '</div>' +
      '</div>' +
      '<a href="https://' + sub + '" target="_blank" class="copy-btn" style="text-decoration:none">Visit ↗</a>';
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
