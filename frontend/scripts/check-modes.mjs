// Real Vite server/build smoke checks; no backend and no external network calls.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, createServer, preview } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configFile = path.join(root, 'vite.config.js');
const outDir = path.join(root, 'node_modules/.cache/mode-check');
const saved = { ENVIRONMENT: process.env.ENVIRONMENT, OPERATIONS_API_URL: process.env.OPERATIONS_API_URL };
delete process.env.OPERATIONS_API_URL;

async function checkServer(server, environment, isPreview = false) {
  const address = server.httpServer.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const response = await fetch(origin + '/config.json');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { environment, operationsApiUrl: null });
  const html = await fetch(origin + '/').then(response => response.text());
  assert.ok(html.includes('id="root"'));
  if (isPreview) {
    const asset = html.match(/src="([^\"]+\.js)"/);
    assert.ok(asset);
    const entry = await fetch(origin + asset[1]);
    assert.equal(entry.status, 200);
    assert.ok((await entry.arrayBuffer()).byteLength > 0);
  }
  console.log(`${isPreview ? 'Preview' : 'Dev'}: ${environment} config/root OK without backend`);
}

try {
  for (const environment of ['demo', 'production']) {
    process.env.ENVIRONMENT = environment;
    const server = await createServer({ root, configFile, logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] }, server: { host: '127.0.0.1', port: 0, open: false } });
    try {
      await server.listen();
      await checkServer(server, environment);
    } finally { await server.close(); }

    await build({ root, configFile, logLevel: 'error', build: { outDir, emptyOutDir: true } });
    assert.deepEqual(JSON.parse(await readFile(path.join(outDir, 'config.json'), 'utf8')), { environment, operationsApiUrl: null });
    console.log(`Build: ${environment} config.json OK`);
  }

  // A preview launch setting overrides the JSON shipped in an earlier build.
  for (const environment of ['demo', 'production']) {
    process.env.ENVIRONMENT = environment;
    const server = await preview({ root, configFile, logLevel: 'error', build: { outDir }, preview: { host: '127.0.0.1', port: 0, open: false } });
    try { await checkServer(server, environment, true); }
    finally { await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve())); }
  }
} finally {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
