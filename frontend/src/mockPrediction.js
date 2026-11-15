export function mockPrediction(operationId, scenarioId) {
  const explanationId = `demo-explanation-${operationId}`;
  const generationId = `demo-generation-${operationId}`;
  const rejected = scenarioId === 'checkRejected';
  const missing = scenarioId === 'noExplanation';
  const llmUnavailable = missing || scenarioId === 'llmUnavailable';
  const failed = scenarioId === 'checkFailed';
  return {
    operation_id: operationId,
    request_id: `demo-request-${operationId}`,
    prediction_id: `demo-prediction-${operationId}`,
    dataset_version: 'demo-v1',
    model_version: 'demo-model-v1',
    feature_schema_version: 'demo-features-v1',
    score: 0.82,
    threshold: 0.7,
    explanation: {
      shap: missing ? { status: 'unavailable', reason: 'Демо: вклады отсутствуют.' } : {
        status: 'ready', explanation_id: explanationId, method: 'SHAP',
        method_version: 'demo-shap-v1', output_name: 'score', output_scale: 'demo',
        base_value: 0.62, output_value: 0.82, top_k: 1, remaining_contribution: 0,
        features: [{ name: 'DEMO_FEATURE', value: 1, contribution: 0.2 }],
        template_text: 'Демонстрационный шаблон SHAP: вклад признака составляет +0,2.',
      },
      llm: llmUnavailable ? {
        status: 'unavailable',
        reason: 'Демо: текстовое объяснение недоступно.',
      } : {
        status: 'ready', explanation_id: explanationId, generation_id: generationId,
        model_version: 'demo-llm-v1', prompt_version: 'demo-prompt-v1',
        text: rejected ? 'Демонстрационный отклонённый текст.' :
          'Тестовый текст для проверки отображения объяснения. Он не описывает реальную оценку операции.',
      },
      checks: llmUnavailable ? { status: 'not_run', reason: 'Демо: текст отсутствует.' } : failed ? {
        status: 'failed', reason: 'Демо: проверка завершилась ошибкой.',
      } : {
        status: rejected ? 'rejected' : 'passed', checker_version: 'demo-checker-v1',
        generation_id: generationId, explanation_id: explanationId,
        items: [{ code: 'demo_grounding', status: rejected ? 'rejected' : 'passed',
          violations: rejected ? [{ message: 'Демонстрационный отказ проверки.' }] : [] }],
      },
    },
  };
}
