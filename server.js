const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const STATIC_DIR = __dirname;
const OPENCODE_BASE = 'https://opencode.ai/zen/go/v1/chat/completions';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

function serveStatic(req, res) {
  let filePath = path.join(STATIC_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function proxyToOpenCode(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const apiKey = req.headers['x-api-key'] || '';
    const postOptions = {
      hostname: 'opencode.ai',
      port: 443,
      path: '/zen/go/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const proxyReq = https.request(postOptions, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('[Proxy Error]', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
    });

    proxyReq.write(body);
    proxyReq.end();
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key'
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    proxyToOpenCode(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('  LifeOS Dev Server + OpenCode Go API Proxy');
  console.log('  http://localhost:' + PORT);
  console.log('='.repeat(50));
});