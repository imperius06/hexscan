// ─────────────────────────────────────────
// TOOL 7 — DIRECTORY EXPOSURE CHECKER v2
// 120 paths organizados por categoría
// ─────────────────────────────────────────

const SENSITIVE_PATHS = [
  // ── CREDENCIALES Y CONFIGS ──
  { path: '/.env',                    desc: 'Environment variables / credentials',        cat: 'config' },
  { path: '/.env.local',              desc: 'Local environment file',                     cat: 'config' },
  { path: '/.env.backup',             desc: 'Backup environment file',                    cat: 'config' },
  { path: '/.env.production',         desc: 'Production environment file',                cat: 'config' },
  { path: '/.env.development',        desc: 'Development environment file',               cat: 'config' },
  { path: '/config.php',              desc: 'PHP configuration file',                     cat: 'config' },
  { path: '/config.yml',              desc: 'YAML configuration file',                    cat: 'config' },
  { path: '/config.yaml',             desc: 'YAML configuration file',                    cat: 'config' },
  { path: '/config.json',             desc: 'JSON configuration file',                    cat: 'config' },
  { path: '/config.xml',              desc: 'XML configuration file',                     cat: 'config' },
  { path: '/configuration.php',       desc: 'CMS configuration',                          cat: 'config' },
  { path: '/wp-config.php',           desc: 'WordPress configuration',                    cat: 'config' },
  { path: '/settings.py',             desc: 'Django settings file',                       cat: 'config' },
  { path: '/settings.php',            desc: 'PHP settings file',                          cat: 'config' },
  { path: '/application.properties',  desc: 'Java/Spring configuration',                  cat: 'config' },
  { path: '/local.xml',               desc: 'Magento local config',                       cat: 'config' },
  { path: '/parameters.yml',          desc: 'Symfony parameters',                         cat: 'config' },
  { path: '/database.yml',            desc: 'Database configuration',                     cat: 'config' },
  { path: '/secrets.yml',             desc: 'Secrets file',                               cat: 'config' },
  { path: '/credentials.json',        desc: 'Credentials file',                           cat: 'config' },

  // ── GIT Y CÓDIGO FUENTE ──
  { path: '/.git/config',             desc: 'Git config — source code exposure',          cat: 'git' },
  { path: '/.git/HEAD',               desc: 'Git HEAD file',                              cat: 'git' },
  { path: '/.git/index',              desc: 'Git index file',                             cat: 'git' },
  { path: '/.gitignore',              desc: 'Git ignore — reveals project structure',     cat: 'git' },
  { path: '/.svn/entries',            desc: 'SVN repository exposure',                    cat: 'git' },
  { path: '/.hg/store',               desc: 'Mercurial repository',                       cat: 'git' },
  { path: '/Dockerfile',              desc: 'Docker configuration',                       cat: 'git' },
  { path: '/docker-compose.yml',      desc: 'Docker compose file',                        cat: 'git' },
  { path: '/.travis.yml',             desc: 'CI/CD configuration',                        cat: 'git' },
  { path: '/Jenkinsfile',             desc: 'Jenkins pipeline file',                      cat: 'git' },

  // ── PANELES DE ADMINISTRACIÓN ──
  { path: '/admin',                   desc: 'Admin panel',                                cat: 'admin' },
  { path: '/admin/',                  desc: 'Admin panel directory',                      cat: 'admin' },
  { path: '/admin/login',             desc: 'Admin login page',                           cat: 'admin' },
  { path: '/admin/login.php',         desc: 'Admin login PHP',                            cat: 'admin' },
  { path: '/administrator',           desc: 'Administrator panel',                        cat: 'admin' },
  { path: '/administrator/index.php', desc: 'Joomla admin panel',                         cat: 'admin' },
  { path: '/wp-admin',                desc: 'WordPress admin panel',                      cat: 'admin' },
  { path: '/wp-login.php',            desc: 'WordPress login',                            cat: 'admin' },
  { path: '/phpmyadmin',              desc: 'phpMyAdmin — database admin',                cat: 'admin' },
  { path: '/phpmyadmin/',             desc: 'phpMyAdmin directory',                       cat: 'admin' },
  { path: '/pma',                     desc: 'phpMyAdmin alias',                           cat: 'admin' },
  { path: '/cpanel',                  desc: 'cPanel hosting control',                     cat: 'admin' },
  { path: '/manager/html',            desc: 'Tomcat manager',                             cat: 'admin' },
  { path: '/console',                 desc: 'Admin console',                              cat: 'admin' },
  { path: '/dashboard',               desc: 'Dashboard panel',                            cat: 'admin' },
  { path: '/control',                 desc: 'Control panel',                              cat: 'admin' },
  { path: '/controlpanel',            desc: 'Control panel',                              cat: 'admin' },
  { path: '/login',                   desc: 'Login page',                                 cat: 'admin' },
  { path: '/signin',                  desc: 'Sign in page',                               cat: 'admin' },
  { path: '/portal',                  desc: 'Portal page',                                cat: 'admin' },

  // ── BACKUPS Y ARCHIVOS SENSIBLES ──
  { path: '/backup.zip',              desc: 'Site backup archive',                        cat: 'backup' },
  { path: '/backup.sql',              desc: 'Database backup',                            cat: 'backup' },
  { path: '/backup.tar.gz',           desc: 'Compressed backup',                          cat: 'backup' },
  { path: '/backup.tar',              desc: 'Tar backup',                                 cat: 'backup' },
  { path: '/backup.bak',              desc: 'Backup file',                                cat: 'backup' },
  { path: '/backup',                  desc: 'Backup directory',                           cat: 'backup' },
  { path: '/backups',                 desc: 'Backups directory',                          cat: 'backup' },
  { path: '/db.sql',                  desc: 'Database dump',                              cat: 'backup' },
  { path: '/dump.sql',                desc: 'Database dump',                              cat: 'backup' },
  { path: '/database.sql',            desc: 'Database file',                              cat: 'backup' },
  { path: '/data.sql',                desc: 'Data SQL file',                              cat: 'backup' },
  { path: '/site.tar.gz',             desc: 'Site archive',                               cat: 'backup' },
  { path: '/www.zip',                 desc: 'Web root archive',                           cat: 'backup' },
  { path: '/old',                     desc: 'Old files directory',                        cat: 'backup' },
  { path: '/temp',                    desc: 'Temporary files',                            cat: 'backup' },
  { path: '/tmp',                     desc: 'Temp directory',                             cat: 'backup' },

  // ── INFO DEL SERVIDOR ──
  { path: '/phpinfo.php',             desc: 'PHP info — reveals full server config',      cat: 'server' },
  { path: '/info.php',                desc: 'PHP info page',                              cat: 'server' },
  { path: '/php.php',                 desc: 'PHP info page',                              cat: 'server' },
  { path: '/test.php',                desc: 'Test file left on server',                   cat: 'server' },
  { path: '/test.html',               desc: 'Test HTML file',                             cat: 'server' },
  { path: '/server-status',           desc: 'Apache server status',                       cat: 'server' },
  { path: '/server-info',             desc: 'Apache server info',                         cat: 'server' },
  { path: '/.htaccess',               desc: 'Apache config file',                         cat: 'server' },
  { path: '/web.config',              desc: 'IIS configuration file',                     cat: 'server' },
  { path: '/nginx.conf',              desc: 'Nginx configuration',                        cat: 'server' },
  { path: '/readme.txt',              desc: 'Readme — reveals CMS version',               cat: 'server' },
  { path: '/readme.html',             desc: 'Readme HTML',                                cat: 'server' },
  { path: '/README.md',               desc: 'Readme markdown',                            cat: 'server' },
  { path: '/license.txt',             desc: 'License — reveals software used',            cat: 'server' },
  { path: '/CHANGELOG.md',            desc: 'Changelog — reveals version history',        cat: 'server' },
  { path: '/composer.json',           desc: 'PHP dependencies file',                      cat: 'server' },
  { path: '/package.json',            desc: 'Node.js dependencies',                       cat: 'server' },
  { path: '/Gemfile',                 desc: 'Ruby dependencies',                          cat: 'server' },
  { path: '/requirements.txt',        desc: 'Python dependencies',                        cat: 'server' },

  // ── APIs ──
  { path: '/api',                     desc: 'API endpoint',                               cat: 'api' },
  { path: '/api/v1',                  desc: 'API v1 endpoint',                            cat: 'api' },
  { path: '/api/v2',                  desc: 'API v2 endpoint',                            cat: 'api' },
  { path: '/api/v3',                  desc: 'API v3 endpoint',                            cat: 'api' },
  { path: '/api/users',               desc: 'Users API endpoint',                         cat: 'api' },
  { path: '/api/admin',               desc: 'Admin API endpoint',                         cat: 'api' },
  { path: '/swagger',                 desc: 'Swagger API docs — full API exposure',       cat: 'api' },
  { path: '/swagger-ui.html',         desc: 'Swagger UI',                                 cat: 'api' },
  { path: '/swagger.json',            desc: 'Swagger JSON spec',                          cat: 'api' },
  { path: '/openapi.json',            desc: 'OpenAPI spec',                               cat: 'api' },
  { path: '/api-docs',                desc: 'API documentation',                          cat: 'api' },
  { path: '/graphql',                 desc: 'GraphQL endpoint',                           cat: 'api' },
  { path: '/graphiql',                desc: 'GraphiQL explorer — GraphQL IDE exposed',    cat: 'api' },
  { path: '/v1',                      desc: 'API v1 root',                                cat: 'api' },
  { path: '/rest',                    desc: 'REST API endpoint',                          cat: 'api' },

  // ── LOGS ──
  { path: '/logs',                    desc: 'Log directory',                              cat: 'logs' },
  { path: '/log',                     desc: 'Log directory',                              cat: 'logs' },
  { path: '/error.log',               desc: 'Error log file',                             cat: 'logs' },
  { path: '/access.log',              desc: 'Access log file',                            cat: 'logs' },
  { path: '/debug.log',               desc: 'Debug log file',                             cat: 'logs' },
  { path: '/app.log',                 desc: 'Application log',                            cat: 'logs' },
  { path: '/laravel.log',             desc: 'Laravel log file',                           cat: 'logs' },
  { path: '/storage/logs/laravel.log', desc: 'Laravel storage log',                       cat: 'logs' },

  // ── WORDPRESS ESPECÍFICO ──
  { path: '/wp-content/debug.log',    desc: 'WordPress debug log',                        cat: 'wordpress' },
  { path: '/wp-json',                 desc: 'WordPress REST API — lists all endpoints',   cat: 'wordpress' },
  { path: '/wp-json/wp/v2/users',     desc: 'WordPress users API — user enumeration',     cat: 'wordpress' },
  { path: '/xmlrpc.php',              desc: 'WordPress XML-RPC — brute force vector',     cat: 'wordpress' },
  { path: '/wp-content/uploads',      desc: 'WordPress uploads directory',                cat: 'wordpress' },
  { path: '/wp-includes',             desc: 'WordPress includes directory',               cat: 'wordpress' },
  { path: '/wp-cron.php',             desc: 'WordPress cron file',                        cat: 'wordpress' },

  // ── MISC ──
  { path: '/robots.txt',              desc: 'Robots — reveals hidden paths',              cat: 'misc' },
  { path: '/sitemap.xml',             desc: 'Sitemap — reveals all pages',                cat: 'misc' },
  { path: '/.well-known/security.txt', desc: 'Security contact info',                     cat: 'misc' },
  { path: '/crossdomain.xml',         desc: 'Flash cross-domain policy',                  cat: 'misc' },
  { path: '/clientaccesspolicy.xml',  desc: 'Silverlight access policy',                  cat: 'misc' },
  { path: '/.DS_Store',               desc: 'macOS metadata — reveals directory structure', cat: 'misc' },
  { path: '/Thumbs.db',               desc: 'Windows thumbnail cache',                    cat: 'misc' },
];

const CAT_LABELS = {
  all:       'All',
  config:    'Configs',
  git:       'Git/Code',
  admin:     'Admin Panels',
  backup:    'Backups',
  server:    'Server Info',
  api:       'APIs',
  logs:      'Logs',
  wordpress: 'WordPress',
  misc:      'Misc',
};

let _activeExposureCat = 'all';

function setExposureCat(cat, btn) {
  _activeExposureCat = cat;
  document.querySelectorAll('.exp-tab').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
}

async function checkExposure() {
  const input = document.getElementById('exposure-url').value.trim();
  const resultDiv = document.getElementById('exposure-result');

  if (!input) return;

  const base = input.startsWith('http') ? input : 'https://' + input;
  const origin = new URL(base).origin;

  const paths = _activeExposureCat === 'all'
    ? SENSITIVE_PATHS
    : SENSITIVE_PATHS.filter(function(p) { return p.cat === _activeExposureCat; });

  resultDiv.innerHTML =
    '<div class="result-item warn" id="exposure-progress-item">' +
      '<span>🔍</span>' +
      '<div class="label" id="exposure-progress">Checking 0/' + paths.length + ' paths on ' + origin + '...</div>' +
    '</div>';
  resultDiv.classList.remove('hidden');

  const found = [];
  const forbidden = [];
  let checked = 0;

  const batchSize = 8;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    await Promise.all(batch.map(async function(item) {
      try {
        const res = await fetch(
          'https://sectools-headers.draeneills.workers.dev/?action=exposure&url=' +
          encodeURIComponent(origin) + '&path=' + encodeURIComponent(item.path)
        );
        const data = await res.json();
        checked++;

        const progressEl = document.getElementById('exposure-progress');
        if (progressEl) {
          progressEl.textContent = 'Checking ' + checked + '/' + paths.length + ' paths... (' + Math.round(checked/paths.length*100) + '%)';
        }

        if (data.status === 200) {
          found.push(Object.assign({}, item, { status: 200, label: '🚨 EXPOSED' }));
        } else if (data.status === 403) {
          forbidden.push(Object.assign({}, item, { status: 403, label: '⚠️ EXISTS (blocked)' }));
        } else if (data.status === 301 || data.status === 302) {
          found.push(Object.assign({}, item, { status: data.status, label: '🔄 REDIRECT' }));
        }
      } catch(e) { checked++; }
    }));
  }

  // Render
  resultDiv.innerHTML = '';

  const totalIssues = found.length + forbidden.length;
  const scoreClass = totalIssues === 0 ? 'pass' : found.length > 0 ? 'fail' : 'warn';
  const scoreIcon = totalIssues === 0 ? '✅' : found.length > 0 ? '🚨' : '⚠️';

  const summary = document.createElement('div');
  summary.className = 'result-item ' + scoreClass;
  summary.style.cssText = 'margin-bottom:12px; border-width:2px;';
  summary.innerHTML =
    '<span style="font-size:1.5rem">' + scoreIcon + '</span>' +
    '<div>' +
      '<div class="label" style="font-size:1rem">' +
        (totalIssues === 0
          ? 'No exposed paths found'
          : found.length + ' exposed · ' + forbidden.length + ' blocked') +
      '</div>' +
      '<div class="detail">Checked ' + paths.length + ' paths on ' + origin + '</div>' +
    '</div>';
  resultDiv.appendChild(summary);

  if (totalIssues === 0) {
    const clean = document.createElement('div');
    clean.className = 'result-item pass';
    clean.innerHTML = '<span>✅</span><div class="label">No sensitive paths exposed. Good security posture.</div>';
    resultDiv.appendChild(clean);
    return;
  }

  found.forEach(function(item) {
    const el = document.createElement('div');
    el.className = 'result-item fail';
    el.innerHTML =
      '<span>' + item.label + '</span>' +
      '<div style="flex:1">' +
        '<div class="label" style="font-family:var(--font-mono)">' + item.path + '</div>' +
        '<div class="detail">' + item.desc + '</div>' +
      '</div>' +
      '<a href="' + origin + item.path + '" target="_blank" class="copy-btn" style="text-decoration:none">Visit ↗</a>';
    resultDiv.appendChild(el);
  });

  forbidden.forEach(function(item) {
    const el = document.createElement('div');
    el.className = 'result-item warn';
    el.innerHTML =
      '<span>' + item.label + '</span>' +
      '<div style="flex:1">' +
        '<div class="label" style="font-family:var(--font-mono)">' + item.path + '</div>' +
        '<div class="detail">' + item.desc + ' — exists but access blocked (403)</div>' +
      '</div>';
    resultDiv.appendChild(el);
  });
}
