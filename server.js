const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ROOT = __dirname;
const CATALOG_PATH = path.join(ROOT, 'catalog.json');
const CONFIG_PATH = path.join(ROOT, 'config.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function safePath(urlPath) {
  const clean = decodeURIComponent((urlPath || '/').split('?')[0]);
  const rel = clean === '/' ? '/index.html' : clean;
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) return null;
  return filePath;
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/catalog' && req.method === 'GET') {
    try {
      const json = fs.readFileSync(CATALOG_PATH, 'utf8');
      return send(res, 200, json, 'application/json; charset=utf-8');
    } catch (err) {
      return send(res, 500, JSON.stringify({ error: 'Could not read catalog.json' }), 'application/json; charset=utf-8');
    }
  }

  if (req.url === '/api/catalog' && req.method === 'PUT') {
    try {
      const body = await readBody(req);
      JSON.parse(body);
      fs.writeFileSync(CATALOG_PATH, body, 'utf8');
      return send(res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
    } catch (err) {
      return send(res, 400, JSON.stringify({ error: 'Invalid catalog payload' }), 'application/json; charset=utf-8');
    }
  }

  if (req.url === '/api/config' && req.method === 'GET') {
    try {
      const json = fs.readFileSync(CONFIG_PATH, 'utf8');
      return send(res, 200, json, 'application/json; charset=utf-8');
    } catch (err) {
      return send(res, 500, JSON.stringify({ error: 'Could not read config.json' }), 'application/json; charset=utf-8');
    }
  }

  if (req.url === '/api/config' && req.method === 'PUT') {
    try {
      const body = await readBody(req);
      JSON.parse(body);
      fs.writeFileSync(CONFIG_PATH, body, 'utf8');
      return send(res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
    } catch (err) {
      return send(res, 400, JSON.stringify({ error: 'Invalid config payload' }), 'application/json; charset=utf-8');
    }
  }

  if (req.url === '/api/catalog/reset' && req.method === 'POST') {
    try {
      const json = fs.readFileSync(path.join(ROOT, 'catalog.js'), 'utf8');
      const match = json.match(/var BASE_DEFAULTS = (\{[\s\S]*?\n  \};)/);
      if (!match) throw new Error('Defaults not found');
      return send(res, 501, JSON.stringify({ error: 'Reset endpoint not implemented. Use catalog.json from source control.' }), 'application/json; charset=utf-8');
    } catch (err) {
      return send(res, 500, JSON.stringify({ error: 'Could not reset catalog' }), 'application/json; charset=utf-8');
    }
  }

  const filePath = safePath(req.url);
  if (!filePath) return send(res, 403, 'Forbidden');

  try {
    const stat = fs.existsSync(filePath) && fs.statSync(filePath);
    if (!stat || !stat.isFile()) return send(res, 404, 'Not found');
    const ext = path.extname(filePath).toLowerCase();
    const body = fs.readFileSync(filePath);
    return send(res, 200, body, MIME[ext] || 'application/octet-stream');
  } catch (err) {
    return send(res, 500, 'Server error');
  }
});

server.listen(PORT, () => {
  console.log(`SIS server running at http://localhost:${PORT}`);
});
