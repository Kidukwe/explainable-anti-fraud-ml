import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import DemoApp from '../src/DemoApp.jsx';

afterEach(cleanup);

it('opens the first operation and retains the card while changing its scenario', async () => {
  render(<DemoApp/>);
  expect(screen.queryByLabelText('Карточка операции № 10001')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Открыть операцию № 10001' }));
  const card = screen.getByLabelText('Карточка операции № 10001');
  expect(within(card).getByText('Иванов Иван Иванович')).not.toBeNull();
  expect(within(card).getByText('ИИ')).not.toBeNull();
  expect(within(card).getByText('Не измерялось')).not.toBeNull();
  fireEvent.change(screen.getByRole('combobox', { name: /Демо: сценарий проверки/ }), { target: { value: 'modelUnavailable' } });
  expect(screen.getByLabelText('Карточка операции № 10001')).not.toBeNull();
  expect(within(card).getByText('Проверяем операцию…')).not.toBeNull();
  await within(card).findByText('Модель временно недоступна');
});

it('shows an empty queue and zero sidebar counters in the empty scenario', () => {
  render(<DemoApp/>);
  fireEvent.click(screen.getByRole('button', { name: 'Открыть операцию № 10001' }));
  fireEvent.change(screen.getByRole('combobox', { name: /Демо: сценарий проверки/ }), { target: { value: 'empty' } });
  expect(screen.getByText('В очереди нет операций')).not.toBeNull();
  expect(screen.queryByLabelText('Карточка операции № 10001')).toBeNull();
  for (const tab of screen.getAllByRole('tab')) {
    expect(within(tab).getByText('0')).not.toBeNull();
  }
});

it('uses correct initials and a neutral placeholder for products without an image', () => {
  render(<DemoApp/>);
  fireEvent.click(screen.getByRole('button', { name: 'Открыть операцию № 10000' }));
  const card = screen.getByLabelText('Карточка операции № 10000');
  expect(within(card).getByText('ПП')).not.toBeNull();
  expect(within(card).getByRole('img', { name: 'Изображение товара отсутствует' })).not.toBeNull();
  expect(within(card).queryByRole('img', { name: 'Иллюстрация аэрогриля' })).toBeNull();
});
