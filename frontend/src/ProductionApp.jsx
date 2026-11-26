import React, { useEffect, useState } from 'react';
import { loadOperations } from './runtimeConfig.js';
import OperationsApp from './OperationsApp.jsx';

export default function ProductionApp({ config, getOperations = loadOperations }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({
    key: null,
    queue: null,
    error: null,
  });

  const requestKey = JSON.stringify([config.operationsApiUrl, attempt]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState({ key: requestKey, queue: null, error: null });

    if (!config.operationsApiUrl) {
      return () => controller.abort();
    }

    const timer = setTimeout(() => controller.abort(), 10000);

    Promise.resolve()
      .then(() => getOperations(config.operationsApiUrl, { signal: controller.signal }))
      .then(queue => {
        if (active) {
          setState({ key: requestKey, queue, error: null });
        }
      })
      .catch(() => {
        if (active) {
          setState({
            key: requestKey,
            queue: null,
            error: 'API операций недоступен или вернул неподдерживаемый формат ответа.',
          });
        }
      })
      .finally(() => clearTimeout(timer));

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [config.operationsApiUrl, attempt, getOperations, requestKey]);

  const current = state.key === requestKey
    ? state
    : { queue: null, error: null };

  let notice;
  if (!config.operationsApiUrl) {
    notice = <p className="empty" role="status">API операций не настроен.</p>;
  } else if (current.error) {
    notice = (
      <div className="empty" role="alert">
        <p>{current.error}</p>
        <button className="primary" onClick={() => setAttempt(value => value + 1)}>
          Повторить
        </button>
      </div>
    );
  } else if (current.queue === null) {
    notice = <p className="empty" role="status">Загрузка операций…</p>;
  }

  return (
    <OperationsApp key={requestKey} queue={current.queue} notice={notice}>
      {() => (
        <section className="analysis-result" aria-label="Результат проверки">
          <p>Оценка и объяснение недоступны: API проверки не подключён.</p>
          <dl>
            <dt>Оценка модели</dt><dd>Нет данных</dd>
            <dt>Порог</dt><dd>Нет данных</dd>
            <dt>Версия модели</dt><dd>Нет данных</dd>
            <dt>Вклады признаков (SHAP)</dt><dd>Нет данных</dd>
            <dt>Объяснение</dt><dd>Нет данных</dd>
          </dl>
        </section>
      )}
    </OperationsApp>
  );
}