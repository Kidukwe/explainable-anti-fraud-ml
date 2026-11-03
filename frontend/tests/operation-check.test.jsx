import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import OperationCheck from '../src/OperationCheck.jsx';
import { mockScenarios } from '../src/mockScenarios.js';

afterEach(cleanup);

function answerFor(operationId, scenarioId) {
  const scenario = mockScenarios.find(
    item => item.id === scenarioId,
  );

  if (!scenario) {
    throw new Error(`Нет сценария: ${scenarioId}`);
  }

  return { ...scenario, operationId };
}

function deferred() {
  let resolve;
  let reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function showScenario(scenarioId) {
  const request = vi.fn(async operationId =>
    answerFor(operationId, scenarioId),
  );

  render(
    <OperationCheck
      operationId="10001"
      scenarioId={scenarioId}
      request={request}
    />,
  );

  return request;
}

describe('Состояния проверки операции', () => {
  it('показывает загрузку до получения ответа', () => {
    const pending = deferred();

    render(
      <OperationCheck
        operationId="10001"
        request={() => pending.promise}
      />,
    );

    expect(screen.getByRole('status').textContent)
      .toContain('Проверяем операцию');

    expect(screen.queryByText('Score модели')).toBeNull();
  });

  it('показывает пустое состояние без результата', async () => {
    showScenario('empty');

    expect(await screen.findByText('В очереди нет операций'))
      .not.toBeNull();

    expect(screen.queryByText('Score модели')).toBeNull();
  });

  it('показывает ошибку сети и кнопку повтора', async () => {
    showScenario('networkError');

    expect((await screen.findByRole('alert')).textContent)
      .toContain('Не удалось получить результат проверки');

    expect(screen.getByRole('button', { name: 'Повторить' }))
      .not.toBeNull();

    expect(screen.queryByText('Score модели')).toBeNull();
  });

  it('различает недоступную модель и ошибку сети', async () => {
    showScenario('modelUnavailable');

    expect((await screen.findByRole('alert')).textContent)
      .toContain('Модель временно недоступна');

    expect(screen.queryByText('Score модели')).toBeNull();
  });

  it('показывает готовый mock-ответ отдельными блоками', async () => {
    showScenario('ready');

    await screen.findByText('Получен демонстрационный ответ');

    for (const title of [
      'Score модели',
      'SHAP — вклады признаков',
      'LLM — текстовое объяснение',
      'Checks — проверка ответа',
    ]) {
      expect(
        screen.getByRole('heading', { name: title }),
      ).not.toBeNull();
    }

    expect(screen.getByText('Не предоставлено')).not.toBeNull();

    expect(
      screen.getByText(/Тестовый текст для проверки отображения/),
    ).not.toBeNull();

    expect(
      screen.getByText(/реальные модель, LLM и проверки не подключены/),
    ).not.toBeNull();
  });

  it('явно сообщает об отсутствии объяснения', async () => {
    showScenario('noExplanation');

    expect(
      await screen.findByText('Текстовое объяснение отсутствует'),
    ).not.toBeNull();

    expect(
      screen.queryByText(/Тестовый текст для проверки отображения/),
    ).toBeNull();
  });

  it('показывает отказ проверки без обвинения покупателя', async () => {
    showScenario('checkRejected');

    expect(
      await screen.findByText(/Демонстрационный отказ проверки/),
    ).not.toBeNull();

    expect(
      screen.getByText(
        /Отказ проверки ответа не означает блокировку операции/,
      ),
    ).not.toBeNull();
  });

  it('обрабатывает отклонённый запрос', async () => {
    render(
      <OperationCheck
        operationId="10001"
        request={async () => {
          throw new Error('Connection failed');
        }}
      />,
    );

    expect((await screen.findByRole('alert')).textContent)
      .toContain('Не удалось получить результат проверки');
  });

  it('повторяет запрос после нажатия «Повторить»', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(answerFor('10001', 'networkError'))
      .mockResolvedValueOnce(answerFor('10001', 'ready'));

    render(
      <OperationCheck
        operationId="10001"
        request={request}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'Повторить' }),
    );

    await screen.findByText('Получен демонстрационный ответ');

    expect(request).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Защита от старого результата', () => {
  it('сразу очищает показанный ответ при выборе другой операции', async () => {
    const pendingB = deferred();

    const request = vi.fn(operationId => {
      if (operationId === '10001') {
        return Promise.resolve(answerFor(operationId, 'ready'));
      }

      return pendingB.promise;
    });

    const { rerender } = render(
      <OperationCheck
        operationId="10001"
        request={request}
      />,
    );

    await screen.findByText(
      /Тестовый текст для проверки отображения/,
    );

    rerender(
      <OperationCheck
        operationId="10000"
        request={request}
      />,
    );

    expect(
      screen.queryByText(/Тестовый текст для проверки отображения/),
    ).toBeNull();

    expect(screen.getByRole('status').textContent)
      .toContain('Проверяем операцию');
  });

  it('не заменяет результат Б запоздавшим ответом А', async () => {
    const pendingA = deferred();
    const pendingB = deferred();

    const request = vi.fn(operationId =>
      operationId === '10001'
        ? pendingA.promise
        : pendingB.promise,
    );

    const { rerender } = render(
      <OperationCheck
        operationId="10001"
        request={request}
      />,
    );

    rerender(
      <OperationCheck
        operationId="10000"
        request={request}
      />,
    );

    const answerB = answerFor('10000', 'ready');
    answerB.result = {
      ...answerB.result,
      explanation: 'Mock: ответ операции Б',
    };

    await act(async () => {
      pendingB.resolve(answerB);
    });

    expect(screen.getByText('Mock: ответ операции Б'))
      .not.toBeNull();

    const answerA = answerFor('10001', 'ready');
    answerA.result = {
      ...answerA.result,
      explanation: 'Mock: устаревший ответ операции А',
    };

    await act(async () => {
      pendingA.resolve(answerA);
    });

    expect(screen.getByText('Mock: ответ операции Б'))
      .not.toBeNull();

    expect(
      screen.queryByText('Mock: устаревший ответ операции А'),
    ).toBeNull();
  });

  it('не показывает ответ с чужим operationId', async () => {
    const request = vi.fn(async () =>
      answerFor('OTHER_OPERATION', 'ready'),
    );

    render(
      <OperationCheck
        operationId="10001"
        request={request}
      />,
    );

    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.queryByText(/Тестовый текст для проверки отображения/),
    ).toBeNull();
  });

  it('игнорирует старый сценарий той же операции', async () => {
    const oldRequest = deferred();
    const newRequest = deferred();

    const request = vi.fn((operationId, scenarioId) =>
      scenarioId === 'ready'
        ? oldRequest.promise
        : newRequest.promise,
    );

    const { rerender } = render(
      <OperationCheck
        operationId="10001"
        scenarioId="ready"
        request={request}
      />,
    );

    rerender(
      <OperationCheck
        operationId="10001"
        scenarioId="noExplanation"
        request={request}
      />,
    );

    await act(async () => {
      newRequest.resolve(answerFor('10001', 'noExplanation'));
    });

    await screen.findByText('Текстовое объяснение отсутствует');

    await act(async () => {
      oldRequest.resolve(answerFor('10001', 'ready'));
    });

    expect(
      screen.queryByText(/Тестовый текст для проверки отображения/),
    ).toBeNull();
  });
});