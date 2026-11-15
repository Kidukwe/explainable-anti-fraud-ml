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
    request_id: 'demo-request-model-unavailable',
    error: {
      code: 'model_unavailable',
      message: 'Демонстрационный сценарий недоступности модели.',
      details: null,
    },
  },
  canRetry: true,
  },

{
  id: 'validationError',
  title: 'Некорректный запрос (422)',
  state: 'error',
  message: 'Ошибка ввода',
  result: null,
  error: {
    request_id: 'demo-request-validation-error',
    error: {
      code: 'validation_error',
      message: 'Демо: укажите корректный ID операции.',
      details: [{ field: 'operation_id', code: 'required', message: 'Укажите ID операции' }],
    },
  },
  canRetry: false,
},
{
  id: 'operationNotFound',
  title: 'Операция не найдена (404)',
  state: 'error',
  message: 'Операция не найдена',
  result: null,
  error: {
    request_id: 'demo-request-operation-not-found',
    error: {
      code: 'operation_not_found',
      message: 'Демо: операция не найдена в наборе данных.',
      details: null,
    },
  },
  canRetry: false,
},

{
  id: 'internalError',
  title: 'Ошибка сервера (500)',
  state: 'error',
  message: 'Не удалось выполнить запрос',
  result: null,
  error: {
    request_id: 'demo-request-internal-error',
    error: {
      code: 'internal_error',
      message: 'Демо: при обработке запроса произошла ошибка.',
      details: null,
    },
  },
  canRetry: true,
},

  {
    id: 'ready',
    title: 'Готовый ответ — mock',
    state: 'ready',
    message: 'Получен демонстрационный ответ',
    result: true,
    error: null,
  },
  {
    id: 'noExplanation',
    title: 'Объяснение отсутствует',
    state: 'ready',
    message: 'Объяснение отсутствует',
    result: true,
    error: null,
  },

  {
    id: 'llmUnavailable',
    title: 'SHAP готов, LLM недоступна',
    state: 'ready',
    message: 'Получен демонстрационный ответ',
    result: true,
    error: null,
  },

  {
    id: 'checkRejected',
    title: 'Отказ проверки — mock',
    state: 'checkRejected',
    message: 'Ответ не прошёл проверку',
    result: true,
    error: null,
  },
  {
    id: 'checkFailed',
    title: 'Ошибка проверки текста',
    state: 'ready',
    message: 'Получен демонстрационный ответ',
    result: true,
    error: null,
  },
];
