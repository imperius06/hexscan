/* ─── TOOL 2 — BREACH CHECKER ─── */
async function checkBreach() {
  const email = document.getElementById('breach-email').value.trim();
  const result = document.getElementById('breach-result');

  if (!email || !email.includes('@')) {
    result.className = 'result-box warning';
    result.classList.remove('hidden');
    result.innerHTML = '<span style="color:var(--yellow)">⚠</span> Please enter a valid email address.';
    // Shake el input
    const inp = document.getElementById('breach-email');
    inp.style.animation = 'none';
    inp.offsetHeight;
    inp.style.animation = 'inputShake 0.35s ease';
    return;
  }

  // ── LOADING STATE ──
  result.className = 'result-box';
  result.classList.remove('hidden');
  result.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      <div class="hx-spinner"></div>
      <span style="font-family:var(--font-mono);font-size:0.82rem;color:var(--text-muted)">
        Cross-referencing against breach databases...
      </span>
    </div>
    <div class="hx-progress-track"><div class="hx-progress-bar hx-indeterminate"></div></div>
  `;

  try {
    const response = await fetch('https://sectools-headers.draeneills.workers.dev/?action=breach&email=' + encodeURIComponent(email));
    const data = await response.json();

    if (data.success && data.found > 0) {
      const sources = data.sources.map(s =>
        `<div class="result-item fail" style="margin-top:6px">
          <div style="flex:1">
            <div class="label">${s.name}</div>
            <div class="detail">${s.date || 'Date unknown'}</div>
          </div>
        </div>`
      ).join('');
      result.className = 'result-box danger';
      result.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <span style="font-size:1.4rem">🚨</span>
          <div>
            <div style="font-weight:600;color:var(--red)">Found in ${data.found} breach${data.found > 1 ? 'es' : ''}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);font-family:var(--font-mono)">Change your password on these services immediately</div>
          </div>
        </div>
        ${sources}
      `;
    } else if (data.success && data.found === 0 || (!data.success && data.error === 'Not found')) {
      result.className = 'result-box safe';
      result.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:1.4rem">✅</span>
          <div>
            <div style="font-weight:600;color:var(--green)">No breaches found</div>
            <div style="font-size:0.78rem;color:var(--text-muted);font-family:var(--font-mono)">This email does not appear in any known breach database</div>
          </div>
        </div>
      `;
    } else {
      result.className = 'result-box warning';
      result.innerHTML = `<span style="color:var(--yellow)">⚠</span> ${data.error || data.message || 'Unknown error. Try again.'}`;
    }
  } catch (err) {
    result.className = 'result-box danger';
    result.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:1.2rem">❌</span>
        <div>
          <div style="font-weight:600;color:var(--red)">Connection error</div>
          <div style="font-size:0.78rem;color:var(--text-muted);font-family:var(--font-mono)">Could not reach the API. Check your connection and try again.</div>
        </div>
      </div>
    `;
  }
}
