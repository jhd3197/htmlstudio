#!/usr/bin/env node
// Tiny dev server for the htmlstudio demo.
// Run: npm run demo   →  http://127.0.0.1:5180

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tagHtml, injectBridge, applyPatch } from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// In-memory source — what the AI would have generated.
let source = tagHtml(await readFile(join(here, 'sample.html'), 'utf8'));

const PORT = 5180;

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/' || req.url === '/index.html') {
      const html = await readFile(join(here, 'host.html'), 'utf8');
      return send(res, 200, 'text/html; charset=utf-8', html);
    }
    if (req.url === '/preview') {
      const wrapped = `<!doctype html><html><head><meta charset="utf-8"><title>preview</title></head><body>${source}</body></html>`;
      return send(res, 200, 'text/html; charset=utf-8', injectBridge(wrapped, { targetOrigin: '*' }));
    }
    if (req.url === '/source') {
      return send(res, 200, 'application/json', JSON.stringify({ source }));
    }
    if (req.url === '/patch' && req.method === 'POST') {
      const body = await readBody(req);
      const patch = JSON.parse(body);
      const result = applyPatch(source, patch);
      if (result.ok) source = result.source;
      return send(res, 200, 'application/json', JSON.stringify(result));
    }
    send(res, 404, 'text/plain', 'not found');
  } catch (err) {
    send(res, 500, 'text/plain', String(err && err.stack || err));
  }
});

function send(res, code, type, body) {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`htmlstudio demo → http://127.0.0.1:${PORT}`);
});
