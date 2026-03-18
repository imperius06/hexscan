/* ─── TOOL 1 — PASSWORD GENERATOR ─── */

function generatePassword() {
  const length = parseInt(document.getElementById('pw-length').value);
  const useUpper = document.getElementById('pw-upper').checked;
  const useLower = document.getElementById('pw-lower').checked;
  const useNumbers = document.getElementById('pw-numbers').checked;
  const useSymbols = document.getElementById('pw-symbols').checked;

  let chars = '';
  if (useUpper)   chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useLower)   chars += 'abcdefghijklmnopqrstuvwxyz';
  if (useNumbers) chars += '0123456789';
  if (useSymbols) chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';

  if (!chars) {
    document.getElementById('pw-output').textContent = 'Select at least one option.';
    return;
  }

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  const password = Array.from(array, n => chars[n % chars.length]).join('');
  document.getElementById('pw-output').textContent = password;
  updateStrength(password);
}

function updateStrength(password) {
  const wrap = document.getElementById('pw-strength');
  const bar = document.getElementById('pw-strength-bar');
  const label = document.getElementById('pw-strength-label');
  wrap.style.display = 'flex';

  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 20) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Very Weak',   color: '#ff4444', width: '16%' },
    { label: 'Weak',        color: '#ff8800', width: '32%' },
    { label: 'Fair',        color: '#ffd600', width: '50%' },
    { label: 'Strong',      color: '#00e5ff', width: '72%' },
    { label: 'Very Strong', color: '#00ff88', width: '90%' },
    { label: 'Excellent',   color: '#00ff88', width: '100%' },
  ];

  const level = levels[Math.min(score, levels.length - 1)];
  bar.style.width = level.width;
  bar.style.background = level.color;
  label.textContent = level.label;
  label.style.color = level.color;
}
