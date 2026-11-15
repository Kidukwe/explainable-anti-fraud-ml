import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, createServer, preview } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const configFile = path.join(root, 'vite.config.js');
const outDir = path.join(root, 'node_modules', '.cache', 'mode-check');
const environments = ['demo', 'production'];

const savedEnv = {
  ENVIRONMENT: process.env.ENVIRONMENT,
  OPERATIONS_API_URL: process.env.OPERATIONS_API_URL,
};

// Пустой адрес перекрывает значение из локального .env.
process.env.OPERATIONS_API_URL = '';

function expectedConfig(environment) {
  return { environment, operationsApiUrl: null };
}

async function checkServer(server, environment, label) {
  const { port } = server.httpServer.address();
  const origin = `http://127.0.0.1:${port}`;

  const configResponse = await fetch(`${origin}/config.json`);
  assert.equal(configResponse.status, 200);
  assert.deepEqual(await configResponse.json(), expectedConfig(environment));

  const pageResponse = await fetch(origin);
  assert.equal(pageResponse.status, 200);

  const html = await pageResponse.text();
  assert.ok(html.includes('id="root"'));

  if (label === 'preview') {
    const entry = html.match(/src="([^"]+\.js)"/);
    assert.ok(entry, 'В собранном HTML нет файла приложения');
    const asset = await fetch(new URL(entry[1], origin));
    assert.equal(asset.status, 200);
    assert.ok((await asset.arrayBuffer()).byteLength > 0);
  }

  console.log(`${label}: ${environment} — OK`);
}

try {
  for (const environment of environments) {
    process.env.ENVIRONMENT = environment;

    const server = await createServer({
      root,
      configFile,
      logLevel: 'error',
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { host: '127.0.0.1', port: 0, open: false },
    });

    try {
      await server.listen();
      await checkServer(server, environment, 'dev');
    } finally {
      await server.close();
    }

    await build({
      root,
      configFile,
      logLevel: 'error',
      build: { outDir, emptyOutDir: true },
    });

    const config = await readFile(path.join(outDir, 'config.json'), 'utf8');
    assert.deepEqual(JSON.parse(config), expectedConfig(environment));
    console.log(`build: ${environment} — OK`);

    const previewServer = await preview({
      root,
      configFile,
      logLevel: 'error',
      build: { outDir },
      preview: { host: '127.0.0.1', port: 0, open: false },
    });

    try {
      await checkServer(previewServer, environment, 'preview');
    } finally {
      await new Promise((resolve, reject) => {
        previewServer.httpServer.close(error => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  }
} finally {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}