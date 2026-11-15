import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import RuntimeApp from '../src/RuntimeApp.jsx';
import ProductionApp from '../src/ProductionApp.jsx';
import { loadConfig, loadOperations, validateConfig } from '../src/runtimeConfig.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const production = { environment: 'production', operationsApiUrl: null };
const row = {
  operation_id: 'api-row-1',
  event_time: '2018-04-01T10:00:00',
  amount: 42,
  customer_id: 'customer-1',
  terminal_id: 'terminal-1',
};
const queue = items => ({ dataset_version: 'fdh-test', items });

describe('Environment configuration', () => {
  it('opens the real demo app with a banner and scenario selector', async () => {
    render(<RuntimeApp getConfig={async () => ({ environment: 'demo' })}/>);
    expect(await screen.findByRole('combobox', { name: /Демо: сценарий проверки/ })).not.toBeNull();
    expect(screen.getByText(/показаны mock-данные/)).not.toBeNull();
  });
  it('production has no demo tools or mock operations, even with no API', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    render(<RuntimeApp getConfig={async () => production}/>);
    await screen.findByText(/API операций не настроен/);
    expect(within(screen.getByRole('banner')).getByText('Рабочий режим')).not.toBeNull();
expect(screen.getByRole('table')).not.toBeNull();
expect(screen.getByRole('tab', { name: /Все операции/ }).textContent).toContain('—');
expect(screen.getByRole('searchbox').disabled).toBe(true);
expect(screen.getByText('Выберите операцию')).not.toBeNull();
    expect(screen.queryByRole('combobox', { name: /Демо:/ })).toBeNull();
    expect(screen.queryByText('№ 10001')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('a failed configuration fetch never enables demo', async () => {
    render(<RuntimeApp getConfig={async () => { throw new Error('offline'); }}/>);
    await screen.findByRole('alert');
    expect(screen.queryByText('№ 10001')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
  });
  it.each(['', 'DEMO', 'staging', null])('rejects unknown environment %s', async environment => {
    render(<RuntimeApp getConfig={async () => ({ environment })}/>);
    await screen.findByRole('alert');
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(() => validateConfig({ environment })).toThrow(/ENVIRONMENT/);
  });
  it('reads JSON config from frontend without an API or cached response', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => production });
    vi.stubGlobal('fetch', fetch);
    expect(await loadConfig()).toEqual(production);
    expect(fetch).toHaveBeenCalledWith('/config.json', expect.objectContaining({ cache: 'no-store' }));
  });
  it.each([
    { ok: false },
    { ok: true, json: async () => { throw new Error('HTML, not JSON'); } },
    { ok: true, json: async () => ({ environment: 'invalid' }) },
  ])('does not substitute a config when HTTP or JSON fails', async response => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    await expect(loadConfig()).rejects.toThrow();
  });
});

describe('Production source boundary', () => {
  const config = { ...production, operationsApiUrl: '/configured/queue' };
       it('shows an API error and retries the configured URL without mock fallback', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetch);
    render(<ProductionApp config={config}/>);
    await screen.findByRole('alert');
    expect(fetch).toHaveBeenCalledWith(config.operationsApiUrl, expect.any(Object));
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    await screen.findByRole('alert');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('№ 10001')).toBeNull();
  });
  it('opens only operations returned by the API and keeps model unavailability explicit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => queue([row]) }));
    render(<ProductionApp config={config}/>);
    fireEvent.click(await screen.findByRole('button', { name: 'Открыть операцию № api-row-1' }));
    const card = screen.getByRole('complementary', { name: 'Карточка операции № api-row-1' });
    expect(within(card).getByText(/Оценка и объяснение недоступны/)).not.toBeNull();
    expect(screen.queryByText('№ 10001')).toBeNull();
  });
  it('shows an actual empty response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => queue([]) }));
    render(<ProductionApp config={config}/>);
    await screen.findByText('Операций нет');
    expect(screen.getByRole('tab', { name: /Все операции/ }).textContent).toContain('0');
  });
  it.each([
    { operations: [] },
    { items: [] },
    queue(null),
    queue([{ id: 'missing-fields' }]),
    queue([row, row]),
    queue([{ ...row, amount: '42' }]),
    
  ])('rejects unsupported or inconsistent API payloads', async payload => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => payload }));
    await expect(loadOperations('/queue')).rejects.toThrow();
  });
  it('clears old rows and ignores their late response after the API URL changes', async () => {
    let resolveOld;
    const request = vi.fn()
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
      .mockResolvedValueOnce(queue([row]));
    const { rerender } = render(<ProductionApp config={config} getOperations={request}/>);
    await act(async () => {});
    rerender(<ProductionApp config={{ ...config, operationsApiUrl: '/new-queue' }} getOperations={request}/>);
    await screen.findByRole('button', { name: 'Открыть операцию № api-row-1' });
    await act(async () => resolveOld(queue([{ ...row, operation_id: 'stale-row' }])));
    expect(screen.queryByText('№ stale-row')).toBeNull();
    expect(screen.getByRole('button', { name: 'Открыть операцию № api-row-1' })).not.toBeNull();
  });
  it('does not display an already shown operation under a new API source', async () => {
    const request = vi.fn().mockResolvedValueOnce(queue([row])).mockImplementationOnce(() => new Promise(() => {}));
    const { rerender } = render(<ProductionApp config={config} getOperations={request}/>);
    fireEvent.click(await screen.findByRole('button', { name: 'Открыть операцию № api-row-1' }));
    expect(screen.getByLabelText('Карточка операции № api-row-1')).not.toBeNull();
    rerender(<ProductionApp config={{ ...config, operationsApiUrl: '/another-source' }} getOperations={request}/>);
    expect(screen.queryByText('№ api-row-1')).toBeNull();
    expect(screen.queryByLabelText('Карточка операции № api-row-1')).toBeNull();
    expect(screen.getByText('Загрузка операций…')).not.toBeNull();
  });
});
