# MLAF-6 — сверка с draft MLAF-5

Схема результата сверена с [PR №5, коммит `f08a84d`](https://github.com/Kidukwe/explainable-anti-fraud-ml/blob/f08a84dba32e696b8092b7b275117b1fba8d7aa2/backend/schemas.py). Формат очереди взят из предложения Алины. Доступность HTTP-маршрутов и независимая сверка Алиной остаются на этапе интеграции.

| Поле | Источник в demo и адаптере | Место в интерфейсе |
| --- | --- | --- |
| `dataset_version`, `items` | `demoQueue`, `loadOperations` | Версия набора и таблица |
| `operation_id` | Строка очереди и ответ проверки | Номер операции и привязка ответа к карточке |
| `event_time`, `amount`, `customer_id`, `terminal_id` | Строка очереди | Таблица и карточка; пропуски обозначены явно, валюта не указана |
| `score`, `threshold` | `mockPrediction` | Блок оценки |
| `dataset_version`, `model_version`, `feature_schema_version` | `mockPrediction` | Блок оценки |
| `explanation.shap` | Метод, версия, признаки и шаблон | Блок SHAP; шаблон доступен при недоступном или непроверенном тексте |
| `explanation.llm` | Статус, текст и версии | Текст и версии при успешных проверках |
| `explanation.checks` | `passed`, `rejected`, `not_run`, `failed` | Статус, причины и нарушения |
| `request_id`, `prediction_id`, `explanation_id`, `generation_id` | Идентификаторы в demo-ответе | Служебные поля, в карточке не выводятся |

Очередь работает с предложенной оболочкой без полей заказа, товара, ФИО и валюты. Оценка в demo запрашивается после выбора строки. Ошибки сети и недоступность модели воспроизводятся локальными сценариями. Production использует настроенный URL очереди, а в карточке показывает недоступность оценки до подключения inference API.

Поля признаков SHAP приведены к контракту:

- `raw_value` — исходное число или `null`. Для `null` UI показывает «Нет значения».
- `transformed_value` — преобразованное число, отображаемое отдельно.
- `contribution` — вклад признака.

Завершённые demo-проверки используют `checker_version: "v1"`.
Успешный ответ включает полный набор `top_k_coverage`,
`contribution_direction`, `numeric_consistency`, `no_new_factors`.

Сценарий «SHAP: исходное значение отсутствует» демонстрирует
`raw_value: null` и `transformed_value: 0`.

Результаты checks заданы в mock-ответах. Реальная модель,
LLM и алгоритмы проверок пока не подключены.