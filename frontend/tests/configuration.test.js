// @vitest-environment node

import { mkdtemp, rm, rmdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnv } from 'vite';
import { describe, expect, it, vi } from 'vitest';
import { readEnvironment } from '../config/environment.js';

describe('Конфигурация запуска', () => {
  it('выбирает demo, когда ENVIRONMENT не задан', () => {
    expect(readEnvironment({})).toEqual({
      environment: 'demo',
      operationsApiUrl: null,
    });
  });

  it.each(['demo', 'production'])('принимает окружение %s', environment => {
    expect(readEnvironment({ ENVIRONMENT: environment }).environment)
      .toBe(environment);
  });

  it.each(['', 'DEMO', 'staging', 'production '])(
    'отклоняет неизвестное окружение %j',
    environment => {
      expect(() => readEnvironment({ ENVIRONMENT: environment }))
        .toThrow(/ENVIRONMENT/);
    },
  );

  it('возвращает только публичные настройки frontend', () => {
    expect(readEnvironment({
      ENVIRONMENT: 'production',
      OPERATIONS_API_URL: '/api/queue',
      SECRET_TOKEN: 'test-value',
    })).toEqual({
      environment: 'production',
      operationsApiUrl: '/api/queue',
    });
  });

  it.each([
    'javascript:alert(1)',
    '//example.org/queue',
    'https://user:password@example.org',
    '/queue?token=secret',
    '/queue#secret',
    '/\\remote/queue',
  ])('отклоняет недопустимый адрес API %s', url => {
    expect(() => readEnvironment({ OPERATIONS_API_URL: url })).toThrow();
  });

  it('читает .env и отдаёт приоритет переменным процесса', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'mlaf6-env-'));
    const envFile = join(directory, '.env');
    const prefixes = ['ENVIRONMENT', 'OPERATIONS_API_URL'];

    vi.stubEnv('ENVIRONMENT', undefined);
    vi.stubEnv('OPERATIONS_API_URL', undefined);

    try {
      await writeFile(envFile, [
        'ENVIRONMENT=production',
        'OPERATIONS_API_URL=/api/example',
        'PRIVATE_SETTING=private-example',
      ].join('\n'));

      expect(readEnvironment(loadEnv('development', directory, prefixes)))
        .toEqual({
          environment: 'production',
          operationsApiUrl: '/api/example',
        });

      vi.stubEnv('ENVIRONMENT', 'demo');
      vi.stubEnv('OPERATIONS_API_URL', '');

      expect(readEnvironment(loadEnv('development', directory, prefixes)))
        .toEqual({
          environment: 'demo',
          operationsApiUrl: null,
        });
    } finally {
      vi.unstubAllEnvs();
      await rm(envFile, { force: true });
      await rmdir(directory);
    }
  });
});