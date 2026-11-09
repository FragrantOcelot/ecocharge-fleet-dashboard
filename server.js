/**
 * Tiny local web server for the dashboard (no extra packages needed).
 * Run: npm start   then open http://localhost:3000
 *
 * Security choices:
 *  - Only index.html and files inside css/ and js/ are served. Requests like
 *    /../package.json or /server.js get a 404 (blocks "path traversal").
 *  - Security headers on every response (CSP, nosniff, no framing).
 */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const PUBLIC_DIRS = ['css', 'js'];
const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};
const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; " +
    "object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

/** Returns a safe absolute file path, or null if the request is not allowed. */
function resolveSafePath(requestUrl) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  } catch {
    return null; // bad encoding such as %E0%A4%A
  }
  if (urlPath === '/') urlPath = '/index.html';

  const fullPath = path.resolve(ROOT, '.' + urlPath);
  const relative = path.relative(ROOT, fullPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;

  const allowed = relative === 'index.html' ||
    PUBLIC_DIRS.some((dir) => relative.startsWith(dir + path.sep));
  if (!allowed || !CONTENT_TYPES[path.extname(fullPath)]) return null;
  return fullPath;
}

function send(res, status, body, type) {
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method not allowed');
    return;
  }
  const filePath = resolveSafePath(req.url);
  if (!filePath) {
    send(res, 404, 'Not found');
    return;
  }
  // filePath is checked by resolveSafePath above (allowlist + no "..").
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, 'Not found');
      return;
    }
    send(res, 200, req.method === 'HEAD' ? undefined : data, CONTENT_TYPES[path.extname(filePath)]);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log('EcoCharge dashboard running at http://localhost:' + PORT);
  });
}

module.exports = { resolveSafePath };
