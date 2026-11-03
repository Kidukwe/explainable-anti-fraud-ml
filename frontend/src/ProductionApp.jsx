import React, { useEffect, useState } from 'react';
import { loadOperations } from './runtimeConfig.js';
import { money } from './utils.js';
import brandLogo from './assets/ozon-antifraud.svg';

export default function ProductionApp({
  config,
  getOperations = loadOperations,
}) {
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState({
    key: null,
    items: null,
    error: null,
  });

  const [selectedId, setSelectedId] = useState(null);
  const requestKey = JSON.stringify([config.operationsApiUrl, attempt]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setSelectedId(null);
    setState({ key: requestKey, items: null, error: null });

    if (!config.operationsApiUrl) {
      return () => controller.abort();
    }

    const timer = setTimeout(() => controller.abort(), 10000);

    Promise.resolve()
      .then(() =>
        getOperations(config.operationsApiUrl, {
          signal: controller.signal,
        })
      )
      .then(items => {
        if (active) {
          setState({ key: requestKey, items, error: null });
        }
      })
      .catch(() => {
        if (active) {
          setState({
            key: requestKey,
            items: null,
            error:
              'API операций недоступен или вернул ' +
              'неподдерживаемый формат ответа.',
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
    : { items: null, error: null };

  const selected = current.items?.find(
    item => item.id === selectedId
  );

  return (
    <>
      <header className="header">
        <img className="brand-vector" src={brandLogo} alt="OZON anti fraud" width={122} height={45}/>

        <div className="header-title">
          <span>УЧЕБНЫЙ ПРОЕКТ</span>
          <strong>Данные транзакций</strong>
        </div>

        <span className="environment production-environment">Production</span>
      </header>

      <main className="production-content">
        <h1>All operations</h1>

        <p>
          Окружение: production.
          Доступность модели показывается отдельно.
        </p>

        {!config.operationsApiUrl ? (
          <p role="alert">
            API операций не настроен.
            API проверки моделью не подключён.
          </p>
        ) : current.error ? (
          <div role="alert">
            <p>{current.error}</p>

            <button
              className="primary"
              onClick={() => setAttempt(value => value + 1)}
            >
              Повторить
            </button>
          </div>
        ) : current.items === null ? (
          <p role="status">Загрузка операций…</p>
        ) : current.items.length === 0 ? (
          <p role="status">В очереди нет операций</p>
        ) : (
          <div className="table-card">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Операция</th>
                    <th scope="col">Заказ</th>
                    <th scope="col">Сумма</th>
                    <th scope="col">Статус</th>
                  </tr>
                </thead>

                <tbody>
                  {current.items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <button
                          className="operation-button"
                          onClick={() => setSelectedId(item.id)}
                        >
                          № {item.id}
                        </button>
                      </td>

                      <td>{item.orderId}</td>
                      <td>{money(item.amount)}</td>

                      <td>
                        <span className={'badge ' + item.status}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selected && (
          <section
            className="production-details"
            aria-label={'Карточка операции № ' + selected.id}
          >
            <button
              className="close"
              onClick={() => setSelectedId(null)}
              aria-label="Закрыть карточку операции"
            >
              ×
            </button>

            <h2>№ {selected.id}</h2>
            <p>{money(selected.amount)}</p>
            <p>Заказ № {selected.orderId}</p>

            <p role="status">
              API проверки моделью не подключён.
              Оценка и объяснение недоступны.
            </p>
          </section>
        )}
      </main>
    </>
  );
}
