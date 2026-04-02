/* ─── TOOL 4 — HTTP HEADER ANALYZER ─── */

const SECURITY_HEADERS = [
  {
    name: 'Strict-Transport-Security', desc: 'Forces HTTPS connections (HSTS)', required: true,
    validate(val) {
      const maxAge = val.match(/max-age=(\d+)/i);
      if (!maxAge) return { status: 'fail', message: 'Missing max-age directive.' };
      const age = parseInt(maxAge[1]);
      if (age < 2592000) return { status: 'warn', message: 'max-age=' + age + ' is too low. Recommended: 31536000 (1 year).' };
      if (!val.includes('includeSubDomains')) return { status: 'warn', message: 'Consider adding includeSubDomains for full protection.' };
      if (val.includes('preload')) return { status: 'pass', message: 'max-age >= 1 year + includeSubDomains + preload. Excellent!' };
      return { status: 'pass', message: 'max-age=' + age + ' with includeSubDomains. Good.' };
    }
  },
  {
    name: 'Content-Security-Policy', desc: 'Prevents XSS and data injection attacks', required: true,
    validate(val) {
      const issues = [];
      if (val.includes("'unsafe-inline'")) issues.push("'unsafe-inline' allows inline scripts — XSS risk");
      if (val.includes("'unsafe-eval'"))   issues.push("'unsafe-eval' allows eval() — code injection risk");
      if (val.includes('*'))               issues.push("Wildcard '*' is too permissive");
      if (!val.includes('default-src') && !val.includes('script-src')) issues.push('Missing default-src or script-src');
      if (issues.length === 0) return { status: 'pass', message: 'CSP looks solid. No obvious weaknesses.' };
      if (issues.length === 1) return { status: 'warn', message: 'Weak CSP: ' + issues[0] };
      return { status: 'fail', message: 'Insecure CSP: ' + issues.join('; ') };
    }
  },
  {
    name: 'X-Frame-Options', desc: 'Prevents clickjacking attacks', required: true,
    validate(val) {
      const v = val.toUpperCase().trim();
      if (v === 'DENY') return { status: 'pass', message: 'DENY — strongest setting. No framing allowed.' };
      if (v === 'SAMEORIGIN') return { status: 'pass', message: 'SAMEORIGIN — only same origin can frame this page.' };
      if (v.startsWith('ALLOW-FROM')) return { status: 'warn', message: 'ALLOW-FROM is deprecated. Use CSP frame-ancestors instead.' };
      return { status: 'fail', message: 'Invalid value: "' + val + '". Use DENY or SAMEORIGIN.' };
    }
  },
  {
    name: 'X-Content-Type-Options', desc: 'Prevents MIME-type sniffing', required: true,
    validate(val) {
      if (val.trim().toLowerCase() === 'nosniff') return { status: 'pass', message: 'nosniff — correct and only valid value.' };
      return { status: 'fail', message: 'Invalid value: "' + val + '". Must be exactly "nosniff".' };
    }
  },
  {
    name: 'Referrer-Policy', desc: 'Controls how much referrer info is sent', required: false,
    validate(val) {
      const safe   = ['no-referrer', 'no-referrer-when-downgrade', 'strict-origin', 'strict-origin-when-cross-origin'];
      const unsafe = ['unsafe-url', 'origin-when-cross-origin'];
      const v = val.trim().toLowerCase();
      if (unsafe.includes(v)) return { status: 'fail',  message: '"' + val + '" leaks full URL to third parties.' };
      if (safe.includes(v))   return { status: 'pass',  message: '"' + val + '" — good privacy protection.' };
      return { status: 'warn', message: '"' + val + '" — verify this is intentional.' };
    }
  },
  {
    name: 'Permissions-Policy', desc: 'Controls browser features (camera, mic, geolocation, etc.)', required: false,
    validate(val) {
      const missing = ['camera', 'microphone', 'geolocation', 'payment'].filter(f => !val.includes(f));
      if (missing.length === 0) return { status: 'pass', message: 'All sensitive features explicitly controlled.' };
      return { status: 'warn', message: 'Consider restricting: ' + missing.join(', ') };
    }
  },
  {
    name: 'X-XSS-Protection', desc: 'Legacy XSS filter for older browsers', required: false,
    validate(val) {
      const v = val.trim();
      if (v === '0')             return { status: 'pass', message: 'Disabled (0) — correct for modern sites with strong CSP.' };
      if (v === '1; mode=block') return { status: 'pass', message: 'Enabled with block mode — good for legacy browser support.' };
      if (v === '1')             return { status: 'warn', message: 'Add mode=block for stronger protection.' };
      return { status: 'warn', message: 'Unusual value: "' + val + '"' };
    }
  },
  {
    name: 'Cache-Control', desc: 'Controls how responses are cached', required: false,
    validate(val) {
      const v = val.toLowerCase();
      if (v.includes('no-store'))                             return { status: 'pass', message: 'no-store — sensitive data will not be cached.' };
      if (v.includes('no-cache') && v.includes('private'))   return { status: 'pass', message: 'no-cache + private — good for authenticated pages.' };
      if (v.includes('public') && !v.includes('max-age'))    return { status: 'warn', message: 'public without max-age — browser may cache indefinitely.' };
      if (v.includes('max-age=0'))                           return { status: 'pass', message: 'max-age=0 — forces revalidation on every request.' };
      return { status: 'warn', message: 'Review caching policy: "' + val + '"' };
    }
  },
];

/* ─── Status code color map ───────────────────────────────────────────────── */
function _statusBadge(code) {
  const n = parseInt(code);
  let bg, color, label;
  if (n >= 200 && n < 300) { bg = 'rgba(16,185,129,0.12)'; color = 'var(--green)';  label = code; }
  else if (n >= 300 && n < 400) { bg = 'rgba(34,211,238,0.12)'; color = 'var(--accent)'; label = code; }
  else if (n === 403) { bg = 'rgba(245,158,11,0.12)'; color = 'var(--yellow)'; label = code; }
  else if (n === 404) { bg = 'rgba(245,158,11,0.12)'; color = 'var(--yellow)'; label = code; }
  else if (n >= 400 && n < 500) { bg = 'rgba(244,63,94,0.12)';  color = 'var(--red)';    label = code; }
  else if (n >= 500) { bg = 'rgba(244,63,94,0.18)';  color = 'var(--red)';    label = code; }
  else { bg = 'rgba(255,255,255,0.06)'; color = 'var(--text-muted)'; label = code || '—'; }

  return `<span style="
    display:inline-flex;align-items:center;
    background:${bg};color:${color};
    border:1px solid ${color}44;
    font-family:var(--font-mono);font-size:0.72rem;font-weight:600;
    padding:2px 8px;border-radius:4px;flex-shrink:0
  ">${label}</span>`;
}

/* ─── SVG icons para pass / warn / fail ──────────────────────────────────── */
function _statusIcon(status) {
  if (status === 'pass') return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--green)" style="width:16px;height:16px;flex-shrink:0;margin-top:1px">
      <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/>
    </svg>`;
  if (status === 'warn') return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--yellow)" style="width:16px;height:16px;flex-shrink:0;margin-top:1px">
      <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" clip-rule="evenodd"/>
    </svg>`;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--red)" style="width:16px;height:16px;flex-shrink:0;margin-top:1px">
      <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clip-rule="evenodd"/>
    </svg>`;
}

/* ─── Live Scan ───────────────────────────────────────────────────────────── */
async function scanURL() {
  const url        = document.getElementById('scan-url').value.trim();
  const resultList = document.getElementById('headers-result');

  if (!url) {
    const inp = document.getElementById('scan-url');
    inp.style.animation = 'none';
    inp.offsetHeight;
    inp.style.animation = 'inputShake 0.35s ease';
    return;
  }

  const target = url.startsWith('http') ? url : 'https://' + url;

  resultList.classList.remove('hidden');
  resultList.innerHTML = `
    <div class="result-item" style="border-left:3px solid var(--accent);margin-bottom:12px">
      <div class="hx-spinner"></div>
      <div style="flex:1">
        <div class="label" style="font-family:var(--font-mono)">Fetching headers from <strong>${target}</strong></div>
        <div class="detail" style="font-family:var(--font-mono)">Routing through Cloudflare Worker proxy...</div>
      </div>
    </div>
    <div class="hx-progress-track"><div class="hx-progress-bar hx-indeterminate"></div></div>
  `;

  let response;
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 12000);

    response = await fetch(
      'https://sectools-headers.draeneills.workers.dev/?url=' + encodeURIComponent(target),
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const e = classifyFetchError(null, response);
      showErrorBanner(resultList, e.message, e);
      return;
    }

    const data = await response.json();

    if (data.error) {
      const isTimeout = /timeout|timed out/i.test(data.error);
      showErrorBanner(
        resultList,
        isTimeout ? 'API Timeout. The target did not respond in time. Try again in 60s.' : data.error,
        isTimeout ? { type: 'warn', countdown: 60 } : { type: 'error' }
      );
      return;
    }

    // Mostrar status code con badge de color si lo devuelve el Worker
    if (data.status) {
      const statusNote = document.createElement('div');
      statusNote.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:12px;font-family:var(--font-mono);font-size:0.82rem;color:var(--text-muted)';
      statusNote.innerHTML = `HTTP Status: ${_statusBadge(data.status)}`;
      resultList.innerHTML = '';
      resultList.appendChild(statusNote);
    } else {
      resultList.innerHTML = '';
    }

    document.getElementById('headers-input').value = Object.entries(data.headers)
      .map(e => e[0] + ': ' + e[1]).join('\n');

    analyzeHeaders(resultList);

  } catch (err) {
    const e = classifyFetchError(err, response);
    showErrorBanner(resultList, e.message, e);
  }
}

/* ─── Analyze pasted headers ─────────────────────────────────────────────── */
function analyzeHeaders(existingContainer) {
  const raw        = document.getElementById('headers-input').value.trim();
  const resultList = existingContainer || document.getElementById('headers-result');

  if (!existingContainer) {
    resultList.innerHTML = '';
    resultList.classList.remove('hidden');
  }

  if (!raw) {
    showErrorBanner(resultList, 'No headers provided. Paste some headers or use Live Scan.', { type: 'warn' });
    return;
  }

  const parsed = {};
  let httpStatusCode = null;

  raw.split('\n').forEach(line => {
    line = line.trim();
    if (!line) return;
    // Detectar status line: HTTP/1.1 200 OK
    const statusMatch = line.match(/^HTTP\/[\d.]+\s+(\d{3})/i);
    if (statusMatch) { httpStatusCode = statusMatch[1]; return; }
    const idx = line.indexOf(':');
    if (idx > -1) {
      parsed[line.substring(0, idx).trim().toLowerCase()] = line.substring(idx + 1).trim();
    }
  });

  // Si viene del paste manual y tiene status line, mostrarlo
  if (httpStatusCode && !existingContainer) {
    const statusNote = document.createElement('div');
    statusNote.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:12px;font-family:var(--font-mono);font-size:0.82rem;color:var(--text-muted)';
    statusNote.innerHTML = `HTTP Status: ${_statusBadge(httpStatusCode)}`;
    resultList.insertBefore(statusNote, resultList.firstChild);
  }

  let passCount = 0, warnCount = 0, failCount = 0;
  const items = [];

  SECURITY_HEADERS.forEach(h => {
    const value = parsed[h.name.toLowerCase()];
    let status, message;

    if (!value) {
      status  = h.required ? 'fail' : 'warn';
      message = 'Missing — ' + h.desc;
      if (status === 'fail') failCount++; else warnCount++;
    } else {
      const result = h.validate(value);
      status  = result.status;
      message = result.message;
      if (status === 'pass') passCount++;
      else if (status === 'warn') warnCount++;
      else failCount++;
    }

    items.push({ h, value, status, message });
  });

  const total = SECURITY_HEADERS.length;
  const score = Math.round((passCount / total) * 100);
  const grade = score >= 90 ? 'A+' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'F';
  const gradeColor  = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)';
  const scoreClass  = score >= 75 ? 'pass' : score >= 50 ? 'warn' : 'fail';

  // ── Grade summary ──
  const summary = document.createElement('div');
  summary.className = 'result-item ' + scoreClass;
  summary.style.cssText = 'margin-bottom:12px;border-width:2px;align-items:center;flex-wrap:wrap;gap:8px';
  summary.innerHTML = `
    <div style="
      width:52px;height:52px;border-radius:8px;flex-shrink:0;
      background:${gradeColor}22;border:2px solid ${gradeColor};
      display:flex;align-items:center;justify-content:center;
      font-size:1.4rem;font-weight:700;color:${gradeColor};
      font-family:var(--font-mono)
    ">${grade}</div>
    <div style="flex:1;min-width:160px">
      <div class="label" style="font-size:0.95rem">Security Score: ${score}%</div>
      <div class="detail">
        <span style="color:var(--green)">✓ ${passCount} passed</span> ·
        <span style="color:var(--yellow)">⚠ ${warnCount} warnings</span> ·
        <span style="color:var(--red)">✗ ${failCount} missing</span>
      </div>
    </div>
    <div style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);text-align:right">
      ${total} headers<br>evaluated
    </div>
  `;
  resultList.appendChild(summary);

  // ── Header items ──
  items.forEach(({ h, value, status, message }) => {
    const item = document.createElement('div');
    item.className = 'result-item ' + status;
    item.innerHTML = `
      ${_statusIcon(status)}
      <div style="flex:1">
        <div class="label">${h.name}</div>
        ${value
          ? `<div class="detail" style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-muted);margin-bottom:3px;word-break:break-all">${value}</div>`
          : ''}
        <div class="detail">${message}</div>
      </div>
      ${value ? _statusBadge(
          status === 'pass' ? '200' :
          status === 'warn' ? '301' : '400'
        ).replace(/>([\d]+)</, m => m).replace('200','OK').replace('301','WARN').replace('400','FAIL') : ''}
    `;
    // Simplificar: solo mostrar badge de status en el header HTTP Status, no en cada fila
    // Reescribimos el item sin el badge extra para mantener limpieza
    item.innerHTML = `
      ${_statusIcon(status)}
      <div style="flex:1">
        <div class="label">${h.name}
          ${h.required
            ? `<span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);font-weight:400;margin-left:6px">required</span>`
            : `<span style="font-family:var(--font-mono);font-size:0.65rem;color:var(--text-muted);font-weight:400;margin-left:6px">optional</span>`}
        </div>
        ${value
          ? `<div class="detail" style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-muted);margin-bottom:3px;word-break:break-all">${value}</div>`
          : ''}
        <div class="detail">${message}</div>
      </div>
    `;
    resultList.appendChild(item);
  });
}
