// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readEnvironment } from '../config/environment.js';

describe('Launch configuration', () => {
  it('defaults to demo only when ENVIRONMENT is absent', () => {
    expect(readEnvironment({})).toEqual({ environment: 'demo', operationsApiUrl: null });
  });
  it.each(['demo', 'production'])('accepts %s', environment => {
    expect(readEnvironment({ ENVIRONMENT: environment }).environment).toBe(environment);
  });
  it.each(['', 'DEMO', 'staging', 'production '])('rejects unknown environment %s', ENVIRONMENT => {
    expect(() => readEnvironment({ ENVIRONMENT })).toThrow(/ENVIRONMENT/);
  });
  it('passes only public configuration to the browser', () => {
    expect(readEnvironment({ ENVIRONMENT: 'production', SECRET_TOKEN: 'not-for-browser', OPERATIONS_API_URL: '/api/queue' }))
      .toEqual({ environment: 'production', operationsApiUrl: '/api/queue' });
  });
  it.each(['javascript:alert(1)', '//example.org/queue', 'https://user:password@example.org', '/queue?token=secret', '/queue#secret', '/\\remote/queue'])('rejects unsafe public API address %s', OPERATIONS_API_URL => {
    expect(() => readEnvironment({ OPERATIONS_API_URL })).toThrow();
  });
});
