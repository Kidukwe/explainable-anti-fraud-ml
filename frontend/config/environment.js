import { validateConfig } from '../src/configSchema.js';

export function readEnvironment(env = process.env) {
  return validateConfig({
    environment: env.ENVIRONMENT ?? 'demo',
    operationsApiUrl: env.OPERATIONS_API_URL ?? null,
  });
}

export function environmentPlugin(config) {
  const json = JSON.stringify(config, null, 2) + '\n';
  function middleware(req, res, next) {
    if ((req.url || '').split('?')[0] !== '/config.json') return next();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, HEAD');
      return res.end();
    }
    res.statusCode = 200;
    res.end(req.method === 'HEAD' ? undefined : json);
  }
  return {
    name: 'public-environment-config',
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'config.json', source: json });
    },
  };
}
