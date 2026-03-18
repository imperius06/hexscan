/* ─── TOOL 2 — BREACH CHECKER ─── */

async function checkBreach() {
  const email = document.getElementById('breach-email').value.trim();
  const result = document.getElementById('breach-result');

  if (!email || !email.includes('@')) {
    showResult(result, 'warning', '⚠️ Please enter a valid email address.');
    return;
  }

  showResult(result, '', '🔍 Checking...');

  try {
   const response = await fetch('https://sectools-headers.draeneills.workers.dev/?action=breach&email=' + encodeURIComponent(email));
   const data = await response.json();

    if (data.success && data.found > 0) {
      const sources = data.sources.map(s => '  • ' + s.name + ' (' + (s.date || 'unknown date') + ')').join('\n');
      showResult(result, 'danger', '🚨 Found in ' + data.found + ' breach(es):\n\n' + sources + '\n\n⚠️ Change your password on these services immediately.');
    } else if (data.success && data.found === 0) {
      showResult(result, 'safe', '✅ Good news! This email was not found in any known breach.');
    } else if (!data.success && data.error === 'Not found') {
      showResult(result, 'safe', '✅ Good news! This email was not found in any known breach.');
    } else {
      showResult(result, 'warning', '⚠️ ' + (data.error || data.message || 'Unknown error. Try again.'));
    }
  } catch (err) {
    showResult(result, 'danger', '❌ Error connecting to the API. Try again.');
  }
}
