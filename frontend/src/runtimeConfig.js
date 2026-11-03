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

// Временный адаптер текущего UI.
// Формат нужно сверить с владельцем API перед реальной интеграцией.
export async function loadOperations(url, { signal } = {}) {
  const response = await fetch(url, {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('API операций недоступен');
  }

  const payload = await response.json();

  if (!payload || !Array.isArray(payload.operations)) {
    throw new Error('Формат ответа API не поддерживается');
  }

  const ids = new Set();

  for (const item of payload.operations) {
    if (
      !item ||
      typeof item.id !== 'string' ||
      !item.id ||
      ids.has(item.id) ||
      typeof item.orderId !== 'string' ||
      typeof item.amount !== 'number' ||
      !Number.isFinite(item.amount) ||
      !['approved', 'banned', 'consideration'].includes(item.status)
    ) {
      throw new Error('Некорректная операция в ответе API');
    }

    ids.add(item.id);
  }

  return payload.operations;
}
