import React, { useEffect, useState } from 'react';
import { mockScenarios } from './mockScenarios.js';
import { mockPrediction } from './mockPrediction.js';

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
    result: scenario.result ? mockPrediction(operationId, scenarioId) : null,
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
        if (!active || answer.operationId !== operationId
          || (answer.result && answer.result.operation_id !== operationId)) {
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
          <p>{answer.error?.error?.message ?? answer.error?.message}</p>
        </div>

        {(answer.canRetry ?? answer.error?.canRetry) && (
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

  const { shap, llm, checks } = result?.explanation ?? {};
  const hasShap = shap?.status === 'ready';
  const hasExplanation = llm?.status === 'ready' && checks?.status === 'passed';

  const checkLabels = {
    passed: 'Текст прошёл проверку',
    not_run: 'Проверки не выполнялись',
    rejected: 'Ответ не прошёл проверку',
    failed: 'Ошибка проверки текста',
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
        <dl>
          <dt>Порог</dt><dd>{result?.threshold ?? 'Не предоставлен'}</dd>
          <dt>Версия модели</dt><dd>{result?.model_version ?? 'Не указана'}</dd>
          <dt>Версия схемы признаков</dt><dd>{result?.feature_schema_version ?? 'Не указана'}</dd>
          <dt>Версия набора данных</dt><dd>{result?.dataset_version ?? 'Не указана'}</dd>
        </dl>
        <small>
          Значение не обозначается вероятностью без определения
          шкалы в контракте.
        </small>
      </section>

      <section className="analysis-block">
        <h4>SHAP — вклады признаков</h4>
        {hasShap ? (
          <>
            <p>Версия метода: {shap.method_version}</p>
            <ul>{shap.features.map(({ name, value, contribution }) => (
              <li key={name}>{name}: {value}, вклад {contribution}</li>
            ))}</ul>
          </>
        ) : (
          <p>{shap?.reason ?? 'SHAP-объяснение отсутствует'}</p>
        )}
      </section>

      <section className="analysis-block">
        <h4>LLM — текстовое объяснение</h4>
        <p>
          {hasExplanation
            ? llm.text
            : (llm?.reason ?? 'Текстовое объяснение отсутствует')}
        </p>
        {!hasExplanation && hasShap && (
          <p>Шаблон SHAP: {shap.template_text}</p>
        )}
        {hasExplanation && <small>Версии LLM и промпта: {llm.model_version}, {llm.prompt_version}</small>}
      </section>

      <section className="analysis-block">
        <h4>Checks — проверка ответа</h4>
        <p>
          {checks
            ? checkLabels[checks.status] ??
              'Статус проверки не распознан'
            : 'Результат проверок не предоставлен'}
        </p>

        {checks?.checker_version && <p>Версия проверки: {checks.checker_version}</p>}
        {checks?.reason && (
          <p className="check-reason">{checks.reason}</p>
        )}
        {checks?.items?.flatMap(({ code, violations }) =>
          violations.map(({ message }, index) => <p key={code + ':' + index}>{message}</p>)
        )}

        {checks?.status === 'rejected' && (
          <small>
            Отказ проверки ответа не означает блокировку операции
            или обвинение покупателя.
          </small>
        )}
      </section>
    </section>
  );
}
