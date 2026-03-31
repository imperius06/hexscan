/* ─── TOOL 6 — SUBDOMAIN RECON ─── */
const WORKER_URL = 'https://sectools-headers.draeneills.workers.dev';

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

  resultDiv.classList.remove('hidden');
  resultDiv.innerHTML = `
    <div class="result-item" style="border-left:3px solid var(--accent);margin-bottom:12px">
      <div class="hx-spinner"></div>
      <div style="flex:1">
        <div class="label" style="font-family:var(--font-mono)">Querying passive sources for <strong>${domain}</strong></div>
        <div id="sub-status" class="detail" style="font-family:var(--font-mono)">Connecting to crt.sh & HackerTarget...</div>
      </div>
    </div>
    <div class="hx-progress-track" style="margin-bottom:16px"><div class="hx-progress-bar hx-indeterminate"></div></div>
    <div class="result-item hx-skeleton-row"><div class="hx-skeleton" style="width:14px;height:14px;border-radius:50%;flex-shrink:0"></div><div style="flex:1"><div class="hx-skeleton" style="width:60%;height:11px;border-radius:3px"></div></div><div class="hx-skeleton" style="width:44px;height:22px;border-radius:4px"></div></div>
    <div class="result-item hx-skeleton-row"><div class="hx-skeleton" style="width:14px;height:14px;border-radius:50%;flex-shrink:0"></div><div style="flex:1"><div class="hx-skeleton" style="width:45%;height:11px;border-radius:3px"></div></div><div class="hx-skeleton" style="width:44px;height:22px;border-radius:4px"></div></div>
    <div class="result-item hx-skeleton-row"><div class="hx-skeleton" style="width:14px;height:14px;border-radius:50%;flex-shrink:0"></div><div style="flex:1"><div class="hx-skeleton" style="width:75%;height:11px;border-radius:3px"></div></div><div class="hx-skeleton" style="width:44px;height:22px;border-radius:4px"></div></div>
    <div class="result-item hx-skeleton-row"><div class="hx-skeleton" style="width:14px;height:14px;border-radius:50%;flex-shrink:0"></div><div style="flex:1"><div class="hx-skeleton" style="width:55%;height:11px;border-radius:3px"></div></div><div class="hx-skeleton" style="width:44px;height:22px;border-radius:4px"></div></div>
    <div class="result-item hx-skeleton-row"><div class="hx-skeleton" style="width:14px;height:14px;border-radius:50%;flex-shrink:0"></div><div style="flex:1"><div class="hx-skeleton" style="width:80%;height:11px;border-radius:3px"></div></div><div class="hx-skeleton" style="width:44px;height:22px;border-radius:4px"></div></div>
  `;

  try {
    const res = await fetch(WORKER_URL + '/?action=subdomains&domain=' + encodeURIComponent(domain));
    const data = await res.json();

    if (data.error) {
      resultDiv.innerHTML = '<div class="result-item fail"><span>❌</span><div><div class="label">Error</div><div class="detail">' + data.error + '</div></div></div>';
      return;
    }

    const subdomains = data.subdomains;
    const sources = data.sources;
    const total = data.total;
    resultDiv.innerHTML = '';

    if (total === 0) {
      resultDiv.innerHTML = '<div class="result-item warn"><span>⚠️</span><div><div class="label">No subdomains found for ' + domain + '</div><div class="detail">Try a larger domain or verify the target is correct.</div></div></div>';
      return;
    }

    window._lastSubdomains = subdomains;

    const summary = document.createElement('div');
    summary.className = 'result-item pass';
    summary.style.cssText = 'margin-bottom:12px;border-width:2px';
    summary.innerHTML =
      '<span style="font-size:1.4rem">🎯</span>' +
      '<div style="flex:1">' +
        '<div class="label" style="font-size:1rem">Found <strong>' + total + '</strong> subdomains for ' + domain + '</div>' +
        '<div class="detail">Sources: ' + sources.join(' + ') + ' · Passive recon only · No direct probing</div>' +
      '</div>' +
      '<button class="copy-btn" onclick="copySubdomains()">Copy all</button>';
    resultDiv.appendChild(summary);

    const progressDone = document.createElement('div');
    progressDone.className = 'hx-progress-track';
    progressDone.style.marginBottom = '12px';
    progressDone.innerHTML = '<div class="hx-progress-bar" style="width:100%;background:var(--green)"></div>';
    resultDiv.appendChild(progressDone);

    subdomains.forEach(function(sub) {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.style.borderLeft = '3px solid var(--accent)';
      item.innerHTML =
        '<span style="font-size:0.9rem;color:var(--accent)">◆</span>' +
        '<div style="flex:1"><div class="label" style="font-family:var(--font-mono);font-size:0.85rem">' + sub + '</div></div>' +
        '<a href="https://' + sub + '" target="_blank" class="copy-btn" style="text-decoration:none">Visit ↗</a>';
      resultDiv.appendChild(item);
    });

  } catch(err) {
    resultDiv.innerHTML = '<div class="result-item fail"><span>❌</span><div><div class="label">Connection error</div><div class="detail">Could not reach the Worker. Try again.</div></div></div>';
  }
}

function copySubdomains() {
  if (window._lastSubdomains) {
    navigator.clipboard.writeText(window._lastSubdomains.join('\n')).then(function() {
      showToast('Copied ' + window._lastSubdomains.length + ' subdomains!');
    });
  }
}
