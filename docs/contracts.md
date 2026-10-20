# Границы и контракты первого спринта

Уже работает: GET /healthz → 200 {status: ok, service: antifraud};
GET /readyz → 503 {status: not_ready, reason: model_not_implemented};
GET /api/v1/metrics → 503 {status: not_available, metrics: null, reason: evaluation_not_run}.
GET / → operational dashboard; /docs и /openapi.json → реальный контракт.
Liveness контейнера использует /healthz; readiness пока намеренно отрицательная.

Ни /predict, ни фиктивной модели нет. До их реализации согласовать:
- единицу наблюдения, target, время события и время получения метки;
- имена/типы полей, missing/unknown, валюту/единицы, допустимые диапазоны;
- доступность каждой фичи к моменту score и исключение post-outcome leakage;
- response: score, threshold, model_version, feature_schema_version, request_id;
- ошибки 422, отсутствие модели 503, batch limits и latency budget;
- offline evaluation: dataset version, split boundaries, seed, prevalence, threshold,
  confusion matrix, ROC-AUC, PR-AUC (с методом расчёта), precision/recall/F1;
- explainability schema, ограничения интерпретации и отсутствие PII в логах.

Владелец ML-контракта — Tech Lead; API — Fullstack 1; UI — Fullstack 2;
MLOps проверяет artifact loading и эксплуатационные ошибки. Черновик не является
готовым API-контрактом предсказаний: принимается отдельным PR.
