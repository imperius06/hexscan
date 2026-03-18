/* ─────────────────────────────────────────
   SecTools — main.js
   Shared utilities used by all tools.
   ───────────────────────────────────────── */

function copyText(elementId) {
  const el = document.getElementById(elementId);
  const text = el.textContent || el.innerText;
  navigator.clipboard.writeText(text).then(() => showToast());
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

// ─── INIT ───
document.addEventListener('DOMContentLoaded', function() {
  generatePassword();
});
