import React, { useEffect, useState } from 'react';
import { mockScenarios } from './mockScenarios.js';

export async function requestMockCheck(operationId, scenarioId) {
  const scenario = mockScenarios.find(item => item.id === scenarioId);

  if (!scenario) {
    throw new Error('Неизвестный демонстрационный сценарий');
  }

  // Искусственная задержка только для демонстрации UI.
  await new Promise(resolve => setTimeout(resolve, 350));

  return {
    ...scenario,
    operationId,
  };
}

export default function OperationCheck({
  operationId,
  scenarioId = 'ready',
  request = requestMockCheck,
}) {
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    let active = true;

    setResponse(null);

    async function load() {
      try {
        const answer = await request(operationId, scenarioId);

        // Игнорируем ответ старого запроса или другой операции.
        if (!active || answer.operationId !== operationId) {
          return;
        }

        setResponse({
          operationId,
          scenarioId,
          attempt,
          answer,
        });
      } catch {
        if (!active) return;

        setResponse({
          operationId,
          scenarioId,
          attempt,
          answer: {
            state: 'error',
            message: 'Не удалось получить результат проверки',
            result: null,
            error: {
              message: 'Ошибка запроса. Попробуйте повторить.',
              canRetry: true,
            },
          },
        });
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [operationId, scenarioId, attempt, request]);

  // Защита уже на первом рендере с новыми параметрами:
  // результат предыдущей операции не показываем.
  const isCurrent =
    response?.operationId === operationId &&
    response?.scenarioId === scenarioId &&
    response?.attempt === attempt;

  const answer = isCurrent ? response.answer : null;

  if (!answer || answer.state === 'loading') {
    return (
      <section className="analysis-result" aria-label="Результат проверки">
        <p role="status">Проверяем операцию…</p>
      </section>
    );
  }

  if (answer.state === 'empty') {
    return <p role="status">В очереди нет операций</p>;
  }

  if (answer.state === 'error') {
    return (
      <section className="analysis-result" aria-label="Результат проверки">
        <div role="alert">
          <strong>{answer.message}</strong>
          <p>{answer.error?.message}</p>
        </div>

        {answer.error?.canRetry && (
          <button
            type="button"
            onClick={() => setAttempt(value => value + 1)}
          >
            Повторить
          </button>
        )}
      </section>
    );
  }

  const result = answer.result;
  const hasScore =
    typeof result?.score === 'number' &&
    Number.isFinite(result.score);

  const hasShap =
    result?.shap != null &&
    (!Array.isArray(result.shap) || result.shap.length > 0);

  const hasExplanation =
    typeof result?.explanation === 'string' &&
    result.explanation.trim().length > 0;

  const checkLabels = {
    notRun: 'Проверки не выполнялись',
    rejected: 'Ответ не прошёл проверку',
  };

  return (
    <section className="analysis-result" aria-label="Результат проверки">
      <h3>Результат проверки</h3>

      <p className="analysis-note">
        Демо-режим: реальные модель, LLM и проверки не подключены.
      </p>

      <p role="status">{answer.message}</p>

      <section className="analysis-block">
        <h4>Score модели</h4>
        <p>{hasScore ? String(result.score) : 'Не предоставлено'}</p>
        <small>
          Значение не обозначается вероятностью без определения
          шкалы в контракте.
        </small>
      </section>

      <section className="analysis-block">
        <h4>SHAP — вклады признаков</h4>
        {hasShap ? (
          <pre>{JSON.stringify(result.shap, null, 2)}</pre>
        ) : (
          <p>SHAP-объяснение отсутствует</p>
        )}
      </section>

      <section className="analysis-block">
        <h4>LLM — текстовое объяснение</h4>
        <p>
          {hasExplanation
            ? result.explanation
            : 'Текстовое объяснение отсутствует'}
        </p>
        <small>Демонстрационные данные, не ответ реальной LLM.</small>
      </section>

      <section className="analysis-block">
        <h4>Checks — проверка ответа</h4>
        <p>
          {result?.checks
            ? checkLabels[result.checks.status] ??
              'Статус проверки не распознан'
            : 'Результат проверок не предоставлен'}
        </p>

        {result?.checks?.reason && (
          <p className="check-reason">{result.checks.reason}</p>
        )}

        {result?.checks?.status === 'rejected' && (
          <small>
            Отказ проверки ответа не означает блокировку операции
            или обвинение покупателя.
          </small>
        )}
      </section>
    </section>
  );
}