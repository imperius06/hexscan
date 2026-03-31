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
      if (val.includes("'unsafe-inline'")) issues.push("'unsafe-inline' allows inline scripts - XSS risk");
      if (val.includes("'unsafe-eval'"))   issues.push("'unsafe-eval' allows eval() - code injection risk");
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
      const safe = ['no-referrer', 'no-referrer-when-downgrade', 'strict-origin', 'strict-origin-when-cross-origin'];
      const unsafe = ['unsafe-url', 'origin-when-cross-origin'];
      const v = val.trim().toLowerCase();
      if (unsafe.includes(v)) return { status: 'fail', message: '"' + val + '" leaks full URL to third parties.' };
      if (safe.includes(v)) return { status: 'pass', message: '"' + val + '" — good privacy protection.' };
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
      if (v === '0') return { status: 'pass', message: 'Disabled (0) — correct for modern sites with strong CSP.' };
      if (v === '1; mode=block') return { status: 'pass', message: 'Enabled with block mode — good for legacy browser support.' };
      if (v === '1') return { status: 'warn', message: 'Add mode=block for stronger protection.' };
      return { status: 'warn', message: 'Unusual value: "' + val + '"' };
    }
  },
  {
    name: 'Cache-Control', desc: 'Controls how responses are cached', required: false,
    validate(val) {
      const v = val.toLowerCase();
      if (v.includes('no-store')) return { status: 'pass', message: 'no-store — sensitive data will not be cached.' };
      if (v.includes('no-cache') && v.includes('private')) return { status: 'pass', message: 'no-cache + private — good for authenticated pages.' };
      if (v.includes('public') && !v.includes('max-age')) return { status: 'warn', message: 'public without max-age — browser may cache indefinitely.' };
      if (v.includes('max-age=0')) return { status: 'pass', message: 'max-age=0 — forces revalidation on every request.' };
      return { status: 'warn', message: 'Review caching policy: "' + val + '"' };
    }
  },
];

async function scanURL() {
  const url = document.getElementById('scan-url').value.trim();
  const resultList = document.getElementById('headers-result');

  if (!url) {
    const inp = document.getElementById('scan-url');
    inp.style.animation = 'none';
    inp.offsetHeight;
    inp.style.animation = 'inputShake 0.35s ease';
    return;
  }

  const target = url.startsWith('http') ? url : 'https://' + url;

  // ── LOADING STATE ──
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

  try {
    const response = await fetch('https://sectools-headers.draeneills.workers.dev/?url=' + encodeURIComponent(target));
    const data = await response.json();

    if (data.error) {
      resultList.innerHTML = `
        <div class="result-item fail">
          <span>❌</span>
          <div>
            <div class="label">Failed to fetch headers</div>
            <div class="detail">${data.error}</div>
          </div>
        </div>`;
      return;
    }

    document.getElementById('headers-input').value = Object.entries(data.headers)
      .map(e => e[0] + ': ' + e[1]).join('\n');
    analyzeHeaders();

  } catch (err) {
    resultList.innerHTML = `
      <div class="result-item fail">
        <span>❌</span>
        <div>
          <div class="label">Connection error</div>
          <div class="detail">Could not reach the Worker proxy. Check your connection and try again.</div>
        </div>
      </div>`;
  }
}

function analyzeHeaders() {
  const raw = document.getElementById('headers-input').value.trim();
  const resultList = document.getElementById('headers-result');
  resultList.innerHTML = '';
  resultList.classList.remove('hidden');

  if (!raw) {
    resultList.innerHTML = `
      <div class="result-item warn">
        <span>⚠️</span>
        <div class="label">No headers provided</div>
      </div>`;
    return;
  }

  const parsed = {};
  raw.split('\n').forEach(function(line) {
    line = line.trim();
    if (!line || line.startsWith('HTTP/')) return;
    const idx = line.indexOf(':');
    if (idx > -1) {
      parsed[line.substring(0, idx).trim().toLowerCase()] = line.substring(idx + 1).trim();
    }
  });

  let passCount = 0, warnCount = 0, failCount = 0;
  const items = [];

  SECURITY_HEADERS.forEach(function(h) {
    const value = parsed[h.name.toLowerCase()];
    let status, message;

    if (!value) {
      status = h.required ? 'fail' : 'warn';
      message = 'Missing — ' + h.desc;
    } else {
      const result = h.validate(value);
      status = result.status;
      message = result.message;
      if (status === 'pass') passCount++;
      else if (status === 'warn') warnCount++;
      else failCount++;
    }

    if (!value && status === 'fail') failCount++;
    else if (!value && status === 'warn') warnCount++;

    const iconMap = { pass: '✅', warn: '⚠️', fail: '❌' };
    items.push({ h, value, status, message, icon: iconMap[status] });
  });

  const total = SECURITY_HEADERS.length;
  const score = Math.round((passCount / total) * 100);
  const grade = score >= 90 ? 'A+' : score >= 75 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'F';
  const gradeColor = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)';
  const scoreClass = score >= 75 ? 'pass' : score >= 50 ? 'warn' : 'fail';

  // ── GRADE SUMMARY ──
  const summary = document.createElement('div');
  summary.className = 'result-item ' + scoreClass;
  summary.style.cssText = 'margin-bottom:12px;border-width:2px;align-items:center';
  summary.innerHTML = `
    <div style="
      width:52px;height:52px;border-radius:8px;
      background:${gradeColor}22;border:2px solid ${gradeColor};
      display:flex;align-items:center;justify-content:center;
      font-size:1.4rem;font-weight:700;color:${gradeColor};
      font-family:var(--font-mono);flex-shrink:0
    ">${grade}</div>
    <div style="flex:1">
      <div class="label" style="font-size:1rem">Security Score: ${score}%</div>
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

  // ── HEADER ITEMS ──
  items.forEach(function({ h, value, status, message, icon }) {
    const item = document.createElement('div');
    item.className = 'result-item ' + status;
    item.innerHTML = `
      <span>${icon}</span>
      <div style="flex:1">
        <div class="label">${h.name}</div>
        ${value
          ? `<div class="detail" style="font-family:var(--font-mono);font-size:0.78rem;color:var(--text-muted);margin-bottom:3px;word-break:break-all">${value}</div>`
          : ''}
        <div class="detail">${message}</div>
      </div>
    `;
    resultList.appendChild(item);
  });
}
