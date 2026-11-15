import { validateConfig } from './configSchema.js';
export { validateConfig } from './configSchema.js';

export async function loadConfig({ signal } = {}) {
  const response = await fetch(import.meta.env.BASE_URL + 'config.json', {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Не удалось получить конфигурацию приложения');
  }

  return validateConfig(await response.json());
}

export async function loadOperations(url, { signal } = {}) {
  const response = await fetch(url, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error('API операций недоступен');

  const queue = await response.json();
  if (typeof queue?.dataset_version !== 'string' || !queue.dataset_version.trim()
    || !Array.isArray(queue.items)) {
    throw new Error('Неподдерживаемый формат очереди');
  }

  const ids = new Set();
  const items = queue.items.map(item => {
    const { operation_id, event_time, amount, customer_id, terminal_id } = item ?? {};

    if (![operation_id, customer_id, terminal_id].every(
      value => typeof value === 'string' && value.trim().length > 0,
    )) {
      throw new Error('Некорректный идентификатор операции, клиента или терминала');
    }

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Некорректная сумма операции');
    }

    if (!isValidEventTime(event_time)) {
      throw new Error('Некорректное время операции');
    }

    const operationId = operation_id.trim();
    if (ids.has(operationId)) {
      throw new Error('Повторяющийся идентификатор операции');
    }
    ids.add(operationId);

    return {
      ...item,
      operation_id: operationId,
      customer_id: customer_id.trim(),
      terminal_id: terminal_id.trim(),
    };
  });

  return { ...queue, items };
}

function isValidEventTime(value) {
  if (typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)
    || value.startsWith('0000-')) {
    return false;
  }

  const date = new Date(`${value}Z`);
  return Number.isFinite(date.getTime())
    && date.toISOString() === `${value}.000Z`;
}
