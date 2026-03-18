// ─────────────────────────────────────────
// TOOL 8 — IP ANALYZER
// Geolocation + Reputation + WHOIS + Ports + Domains
// ─────────────────────────────────────────

// API key is in the Cloudflare Worker — not here

async function analyzeIP() {
  const input = document.getElementById('ip-input').value.trim();
  const resultDiv = document.getElementById('ip-result');

  if (!input) return;

  resultDiv.innerHTML = '<div class="result-item warn"><span>🔍</span><div class="label">Analyzing ' + input + '...</div></div>';
  resultDiv.classList.remove('hidden');

  // Run all queries in parallel
  const [geo, abuse, ports, domains] = await Promise.allSettled([
    fetchGeo(input),
    fetchAbuse(input),
    fetchPorts(input),
    fetchDomains(input),
  ]);

  resultDiv.innerHTML = '';

  // ── GEOLOCATION ──
  if (geo.status === 'fulfilled' && geo.value) {
    const g = geo.value;
    const section = createSection('🌍 Geolocation & ISP', 'pass');
    section.innerHTML +=
      row('IP', input) +
      row('Country', g.country + ' ' + (g.countryCode || '')) +
      row('City', g.city + ', ' + g.regionName) +
      row('ISP', g.isp) +
      row('Organization', g.org) +
      row('Timezone', g.timezone) +
      row('Coordinates', g.lat + ', ' + g.lon);
    resultDiv.appendChild(section);
  }

  // ── REPUTATION ──
  if (abuse.status === 'fulfilled' && abuse.value) {
    const a = abuse.value.data;
    const score = a.abuseConfidenceScore;
    const cls = score >= 50 ? 'fail' : score >= 20 ? 'warn' : 'pass';
    const section = createSection('🛡️ Reputation & Abuse Score', cls);
    section.innerHTML +=
      row('Abuse Score', score + '/100 ' + (score >= 50 ? '🚨 High Risk' : score >= 20 ? '⚠️ Medium Risk' : '✅ Clean')) +
      row('Total Reports', a.totalReports) +
      row('Last Reported', a.lastReportedAt || 'Never') +
      row('ISP', a.isp) +
      row('Domain', a.domain || 'N/A') +
      row('Tor Exit Node', a.isTor ? '⚠️ YES' : '✅ No') +
      row('Usage Type', a.usageType || 'N/A');
    resultDiv.appendChild(section);
  } else {
    const section = createSection('🛡️ Reputation', 'warn');
    section.innerHTML += row('Status', '⚠️ AbuseIPDB unavailable — check API key');
    resultDiv.appendChild(section);
  }

  // ── OPEN PORTS (Shodan InternetDB) ──
  if (ports.status === 'fulfilled' && ports.value) {
    const p = ports.value;
    const hasPorts = p.ports && p.ports.length > 0;
    const section = createSection('🔌 Open Ports (Shodan)', hasPorts ? 'warn' : 'pass');
    if (hasPorts) {
      section.innerHTML += row('Open Ports', p.ports.join(', '));
    } else {
      section.innerHTML += row('Open Ports', '✅ No known open ports');
    }
    if (p.vulns && p.vulns.length > 0) {
      section.innerHTML += row('Known CVEs', '🚨 ' + p.vulns.join(', '));
    }
    if (p.tags && p.tags.length > 0) {
      section.innerHTML += row('Tags', p.tags.join(', '));
    }
    if (p.hostnames && p.hostnames.length > 0) {
      section.innerHTML += row('Hostnames', p.hostnames.join(', '));
    }
    resultDiv.appendChild(section);
  }

  // ── DOMAINS ON THIS IP ──
  if (domains.status === 'fulfilled' && domains.value) {
    const d = domains.value;
    const section = createSection('🌐 Domains on this IP', d.length > 0 ? 'warn' : 'pass');
    if (d.length > 0) {
      section.innerHTML += row('Total domains', d.length);
      d.slice(0, 15).forEach(function(domain) {
        const item = document.createElement('div');
        item.style.cssText = 'padding:4px 0; font-family:var(--font-mono); font-size:0.82rem; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;';
        item.innerHTML = '<span>' + domain + '</span><a href="https://' + domain + '" target="_blank" class="copy-btn" style="text-decoration:none;font-size:0.7rem">Visit ↗</a>';
        section.appendChild(item);
      });
      if (d.length > 15) {
        const more = document.createElement('div');
        more.style.cssText = 'font-size:0.78rem; color:var(--text-muted); margin-top:8px;';
        more.textContent = '... and ' + (d.length - 15) + ' more domains';
        section.appendChild(more);
      }
    } else {
      section.innerHTML += row('Domains', '✅ No other domains found on this IP');
    }
    resultDiv.appendChild(section);
  }
}

// ── API FETCHERS ──

async function fetchGeo(ip) {
  const res = await fetch('https://sectools-headers.draeneills.workers.dev/?action=geo&ip=' + encodeURIComponent(ip));
  return await res.json();
}

async function fetchAbuse(ip) {
  const res = await fetch('https://sectools-headers.draeneills.workers.dev/?action=abuse&ip=' + encodeURIComponent(ip));
  return await res.json();
}

async function fetchPorts(ip) {
  const res = await fetch('https://sectools-headers.draeneills.workers.dev/?action=ports&ip=' + encodeURIComponent(ip));
  return await res.json();
}

async function fetchDomains(ip) {
  const res = await fetch('https://sectools-headers.draeneills.workers.dev/?action=domains&ip=' + encodeURIComponent(ip));
  const data = await res.json();
  if (!data.result || data.result.includes('error')) return [];
  return data.result.split('\n').map(function(d) { return d.trim(); }).filter(Boolean);
}
// ── HELPERS ──

function createSection(title, cls) {
  const div = document.createElement('div');
  div.className = 'result-item ' + cls;
  div.style.cssText = 'flex-direction:column; align-items:flex-start; gap:8px; margin-bottom:8px;';
  div.innerHTML = '<div class="label" style="font-size:1rem; margin-bottom:4px;">' + title + '</div>';
  return div;
}

function row(label, value) {
  return '<div style="display:flex;gap:12px;font-size:0.85rem;width:100%;border-bottom:1px solid var(--border);padding:4px 0">' +
    '<span style="color:var(--text-muted);min-width:140px;font-family:var(--font-mono)">' + label + '</span>' +
    '<span style="color:var(--text);word-break:break-all">' + value + '</span>' +
  '</div>';
}
