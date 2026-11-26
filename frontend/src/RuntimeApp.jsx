import React, {
  lazy,
  Suspense,
  useEffect,
  useState,
} from 'react';

import {
  loadConfig,
  validateConfig,
} from './runtimeConfig.js';

import ProductionApp from './ProductionApp.jsx';

const DemoApp = lazy(() => import('./DemoApp.jsx'));

export default function RuntimeApp({ getConfig = loadConfig }) {
  const [state, setState] = useState({
    config: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const timer = setTimeout(() => controller.abort(), 10000);

    Promise.resolve()
      .then(() => getConfig({ signal: controller.signal }))
      .then(validateConfig)
      .then(config => {
        if (active) {
          setState({ config, error: null });
        }
      })
      .catch(() => {
        if (active) {
          setState({
            config: null,
            error:
              'Не удалось загрузить корректную конфигурацию. ' +
              'Проверьте config.json и параметр ENVIRONMENT при запуске.',
          });
        }
      })
      .finally(() => clearTimeout(timer));

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [getConfig]);

  if (state.error) {
    return (
      <main className="runtime-status">
        <h1>Ошибка конфигурации</h1>
        <p role="alert">{state.error}</p>
      </main>
    );
  }

  if (!state.config) {
    return (
      <main className="runtime-status">
        <p role="status">Загрузка конфигурации…</p>
      </main>
    );
  }

  if (state.config.environment === 'production') {
    return <ProductionApp config={state.config} />;
  }

  return (
    <Suspense fallback={<p role="status">Загрузка демо…</p>}>
      <DemoApp />
    </Suspense>
  );
}
