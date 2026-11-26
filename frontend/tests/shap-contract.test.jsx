import React from 'react';
import {
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';

import OperationCheck from '../src/OperationCheck.jsx';
import { mockPrediction } from '../src/mockPrediction.js';
import { mockScenarios } from '../src/mockScenarios.js';

afterEach(cleanup);

function answerFor(operationId, scenarioId) {
  const scenario = mockScenarios.find(item => item.id === scenarioId);

  return {
    ...scenario,
    operationId,
    result: mockPrediction(operationId, scenarioId),
  };
}

function showScenario(scenarioId) {
  const request = async operationId =>
    answerFor(operationId, scenarioId);

  render(
    <OperationCheck
      operationId="10001"
      scenarioId={scenarioId}
      request={request}
    />,
  );
}

describe('Контракт SHAP и demo-checks', () => {
  it('отображает исходный null отдельно от преобразованного нуля', async () => {
    showScenario('shapMissingValue');

    const feature = (
      await screen.findByText('DEMO_FEATURE')
    ).closest('li');

    expect(
      within(feature)
        .getByText('Исходное значение')
        .nextElementSibling.textContent,
    ).toBe('Нет значения');

    expect(
      within(feature)
        .getByText('Преобразованное значение')
        .nextElementSibling.textContent,
    ).toBe('0');

    expect(
      within(feature)
        .getByText('Вклад')
        .nextElementSibling.textContent,
    ).toBe('0.2');
  });

  it('показывает исходный ноль как значение', async () => {
    const answer = answerFor('10001', 'ready');

    answer.result.explanation.shap.features[0].raw_value = 0;
    answer.result.explanation.shap.features[0].transformed_value = 1;

    render(
      <OperationCheck
        operationId="10001"
        request={async () => answer}
      />,
    );

    const feature = (
      await screen.findByText('DEMO_FEATURE')
    ).closest('li');

    expect(
      within(feature)
        .getByText('Исходное значение')
        .nextElementSibling.textContent,
    ).toBe('0');

    expect(
      within(feature)
        .getByText('Преобразованное значение')
        .nextElementSibling.textContent,
    ).toBe('1');
  });

  it.each(mockScenarios.filter(scenario => scenario.result))(
    'demo-ответ $id соответствует полям SHAP и набору checks v1',
    ({ id }) => {
      const { shap, llm, checks } =
        mockPrediction('10001', id).explanation;

      if (shap.status === 'ready') {
        for (const feature of shap.features) {
          expect(feature).not.toHaveProperty('value');
          expect(Object.hasOwn(feature, 'raw_value')).toBe(true);

          expect(
            feature.raw_value === null ||
            Number.isFinite(feature.raw_value),
          ).toBe(true);

          expect(Number.isFinite(feature.transformed_value)).toBe(true);
        }
      }

      if (['passed', 'rejected'].includes(checks.status)) {
        expect(checks.checker_version).toBe('v1');

        expect(
          checks.items.map(item => item.code).sort(),
        ).toEqual([
          'contribution_direction',
          'no_new_factors',
          'numeric_consistency',
          'top_k_coverage',
        ]);

        expect(checks.generation_id).toBe(llm.generation_id);
        expect(checks.explanation_id).toBe(shap.explanation_id);

        for (const item of checks.items) {
          expect(item.status).toBe(
            checks.status === 'rejected' &&
            item.code === 'no_new_factors'
              ? 'rejected'
              : 'passed',
          );

          expect(item.violations.length > 0).toBe(
            item.status === 'rejected',
          );
        }
      }
    },
  );
});