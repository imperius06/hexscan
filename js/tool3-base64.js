/* ─── TOOL 3 — BASE64 & JWT DECODER ─── */

function b64Encode() {
  const input = document.getElementById('b64e-input').value;
  try {
    document.getElementById('b64e-output').textContent = btoa(unescape(encodeURIComponent(input)));
  } catch {
    document.getElementById('b64e-output').textContent = 'Error encoding.';
  }
}

function b64Decode() {
  const input = document.getElementById('b64d-input').value.trim();
  try {
    document.getElementById('b64d-output').textContent = decodeURIComponent(escape(atob(input)));
  } catch {
    document.getElementById('b64d-output').textContent = 'Invalid Base64 string.';
  }
}

function decodeJWT() {
  const token = document.getElementById('jwt-input').value.trim();
  const output = document.getElementById('jwt-output');

  const parts = token.split('.');
  if (parts.length !== 3) {
    output.textContent = 'Invalid JWT format. Expected 3 parts separated by dots.';
    output.classList.remove('hidden');
    return;
  }

  try {
    const decode = str => JSON.parse(decodeURIComponent(escape(atob(
      str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=')
    ))));

    const header  = decode(parts[0]);
    const payload = decode(parts[1]);
    const now = Math.floor(Date.now() / 1000);
    let expInfo = '';

    if (payload.exp) {
      const diff = payload.exp - now;
      expInfo = diff > 0
        ? '\n⏱ Expires in: ' + Math.floor(diff/3600) + 'h ' + Math.floor((diff%3600)/60) + 'm'
        : '\n⚠️ EXPIRED ' + Math.abs(Math.floor(diff/3600)) + 'h ago';
    }

    output.textContent = '── HEADER ──\n' + JSON.stringify(header, null, 2) +
      '\n\n── PAYLOAD ──\n' + JSON.stringify(payload, null, 2) +
      expInfo + '\n\n── SIGNATURE ──\n' + parts[2];
    output.classList.remove('hidden');
  } catch {
    output.textContent = "Error decoding JWT. Make sure it's a valid token.";
    output.classList.remove('hidden');
  }
}
