# ADR 001: минимальный модульный монолит

Статус: принят для инфраструктурного старта, 2026-10-15.
Один Python 3.12 проект, uv.lock, FastAPI/Pydantic/Uvicorn. UI — статические HTML/CSS/JS
в том же origin. Это даёт двум Fullstack отдельные зоны (HTTP/интерфейс) без второго
package manager, CORS и отдельного deploy. React пока не оправдан.

ML extra: pandas, NumPy, scikit-learn, CatBoost. XAI и notebooks — отдельные extras,
не входят в базовый контейнер API. Классические модели будут сравнены с Logistic
Regression и Random Forest; CatBoost покрывает Gradient Boosting. Реализации нет.
Один будущий model bundle с preprocessing и metadata; обучение offline, inference
не обучает модель. Данные и артефакты на диске вне Git. БД пока не нужна: ни аккаунтов,
ни постоянного журнала запросов в требованиях первого спринта нет.

Метрики offline сохраняются позже в согласованный формат. ROC-AUC дополняется
precision/recall/F1 и PR-кривой; явно указывать, AP это или trapezoidal PR-AUC.
Порог выбирается по validation с учётом затрат и нагрузки на ручную проверку.
Интерпретация отдельно от score; доверие исследовать через калибровку/устойчивость,
а не утверждать по одному объяснению SHAP. LLM-модуль не часть обязательного пути.

Docker Compose — один сервис. GitHub Actions проверяет код и image smoke.
CD и VPS пока подготовлены планом; автоматический deploy без секрета и разрешения
не настроен. PostgreSQL/MLflow/Prometheus/Grafana обсуждать при появлении потребности.

Источники, проверенные 2026-10-15:
- https://fastapi.tiangolo.com/deployment/docker/
- https://docs.astral.sh/uv/guides/projects/
- https://docs.astral.sh/ruff/configuration/
- https://scikit-learn.org/stable/model_selection.html
- https://docs.pytest.org/en/stable/explanation/goodpractices.html
- https://docs.github.com/en/actions/tutorials/build-and-test-code/python
- https://docs.docker.com/compose/how-tos/startup-order/
- https://raw.githubusercontent.com/Kludex/starlette/main/docs/testclient.md

Текущий Starlette TestClient использует httpx2; он включён в dev group.
Обычный httpx может присутствовать транзитивно через Jupyter, но не выбран для тестов API.
