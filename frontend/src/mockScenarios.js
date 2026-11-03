// Демонстрационные сценарии UI.

export const mockScenarios = [
  {
    id: 'loading',
    title: 'Загрузка',
    state: 'loading',
    message: 'Проверяем операцию…',
    result: null,
    error: null,
  },
  {
    id: 'empty',
    title: 'Пустая очередь',
    state: 'empty',
    message: 'В очереди нет операций',
    result: null,
    error: null,
  },
  {
    id: 'networkError',
    title: 'Ошибка сети',
    state: 'error',
    message: 'Не удалось получить результат проверки',
    result: null,
    error: {
      code: 'MOCK_NETWORK_ERROR',
      message: 'Демонстрационная ошибка соединения.',
      canRetry: true,
    },
  },
  {
    id: 'modelUnavailable',
    title: 'Модель недоступна',
    state: 'error',
    message: 'Модель временно недоступна',
    result: null,
    error: {
      code: 'MOCK_MODEL_UNAVAILABLE',
      message: 'Демонстрационный сценарий недоступности модели.',
      canRetry: true,
    },
  },
  {
    id: 'ready',
    title: 'Готовый ответ — mock',
    state: 'ready',
    message: 'Получен демонстрационный ответ',
    result: {
      isMock: true,
      score: null,
      shap: null,
      explanation:
        'Тестовый текст для проверки отображения объяснения. ' +
        'Он не описывает реальную оценку операции.',
      checks: {
        status: 'notRun',
        reason: null,
      },
    },
    error: null,
  },
  {
    id: 'noExplanation',
    title: 'Объяснение отсутствует',
    state: 'ready',
    message: 'Объяснение отсутствует',
    result: {
      isMock: true,
      score: null,
      shap: null,
      explanation: null,
      checks: {
        status: 'notRun',
        reason: null,
      },
    },
    error: null,
  },
  {
    id: 'checkRejected',
    title: 'Отказ проверки — mock',
    state: 'checkRejected',
    message: 'Ответ не прошёл проверку',
    result: {
      isMock: true,
      score: null,
      shap: null,
      explanation: null,
      checks: {
        status: 'rejected',
        reason:
          'Демонстрационный отказ проверки. ' +
          'Реальные проверки не выполнялись.',
      },
    },
    error: null,
  },
];