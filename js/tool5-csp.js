/* ─── TOOL 5 — CSP GENERATOR ─── */

function generateCSP() {
  const fields = [
    { id: 'csp-script',  directive: 'script-src' },
    { id: 'csp-style',   directive: 'style-src' },
    { id: 'csp-img',     directive: 'img-src' },
    { id: 'csp-connect', directive: 'connect-src' },
    { id: 'csp-font',    directive: 'font-src' },
    { id: 'csp-frame',   directive: 'frame-src' },
  ];

  const directives = ["default-src 'self'"];
  fields.forEach(function(f) {
    const val = document.getElementById(f.id).value.trim();
    if (val) directives.push(f.directive + ' ' + val);
  });

  if (document.getElementById('csp-upgrade').checked) directives.push('upgrade-insecure-requests');
  if (document.getElementById('csp-block').checked) directives.push('block-all-mixed-content');

  document.getElementById('csp-output').textContent = 'Content-Security-Policy: ' + directives.join('; ');
  document.getElementById('csp-output-wrap').classList.remove('hidden');
}
