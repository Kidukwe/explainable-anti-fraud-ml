# Explainable Anti-Fraud ML

Учебный командный проект университетского практикума по заданию партнёра OZON.
Это не официальный продукт OZON и не заявление об одобрении компанией.

Цель — поддержка антифрод-аналитика: оценка подозрительных операций, объяснение
решений модели и исследование качества объяснений и обоснованного доверия к ним.
Домен, датасет, target и протокол оценки согласуются до реализации ML.

Репозиторий: [Kidukwe/explainable-anti-fraud-ml](https://github.com/Kidukwe/explainable-anti-fraud-ml).

## Что реализовано

Инфраструктурная основа: Python package, FastAPI, operational dashboard,
uv.lock, Ruff/pytest, Docker Compose, CI и шаблоны совместной разработки.
Данных, EDA, генератора датасета, обученных моделей и inference API пока нет.

| Endpoint | Поведение сейчас |
|---|---|
| GET /healthz | 200: процесс приложения работает |
| GET /readyz | 503: модель ещё не реализована |
| GET /api/v1/metrics | 503, metrics=null: оценка качества ещё не выполнялась |
| GET / | Страница состояния API и отсутствующих ML-результатов |
| GET /docs | Swagger с фактическими API-контрактами |

## Локальный запуск

Нужны Git, uv 0.10.4+, Python 3.12; Docker — для контейнерного запуска.
Команды выполняются из корня этого репозитория:

```bash
git clone https://github.com/Kidukwe/explainable-anti-fraud-ml.git
cd explainable-anti-fraud-ml
uv sync --frozen
uv run uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

Откройте [dashboard](http://127.0.0.1:8000/) и [Swagger](http://127.0.0.1:8000/docs).
Если uv не находит Python 3.12, установите его командой `uv python install 3.12`.

### Smoke: увидеть отсутствие модели

Оставьте сервер работающим. Во втором терминале из корня репозитория выполните:

```bash
uv run --frozen python scripts/smoke.py
```

Успех — строка `PASS: API is alive; model and evaluation are explicitly absent.`
Скрипт проверяет HTTP-статусы и JSON, доступность dashboard и Swagger;
при неожиданном ответе или недоступном сервере завершается с ненулевым кодом.
Он предназначен для текущего bootstrap: после реализации модели ожидания нужно обновить.

В браузере откройте dashboard и нажмите «Обновить». Ожидается:
API — «Работает», модель — «Ещё не реализована», качество —
«Оценка ещё не выполнена. Метрики отсутствуют.»
HTTP 503 на `/readyz` и `/api/v1/metrics` здесь ожидаемы: сервис запущен,
но обученной модели и результатов оценки нет. Проверять их через `curl --fail`
как успешные ответы нельзя. Остановка локального сервера — `Ctrl+C`.

Для ML-исследований доступны отдельные extras:

```bash
uv sync --frozen --extra ml --extra notebooks --extra xai
uv run --extra ml --extra notebooks --extra xai jupyter lab
```

Указывайте нужные extras и в исследовательских `uv run`: uv синхронизирует выбранный
состав окружения. Базовый API не требует ML, SHAP или Jupyter.

## Проверки и Docker

```bash
uv run ruff check .
uv run ruff format --check .
uv run pytest
docker compose config --quiet
docker compose up --build --wait
curl --fail http://127.0.0.1:8000/healthz
uv run --frozen python scripts/smoke.py
docker compose down
```

Compose читает APP_PORT (по умолчанию 8000). Для другого порта скопируйте
.env.example в .env. На хосте порт привязан к 127.0.0.1. Контейнер работает
от непривилегированного пользователя; данные и модели не входят в build context.
Проверка Docker требует запущенного Engine. 503 на readiness/метриках сейчас ожидаемы.
При изменённом APP_PORT передайте smoke адрес, например
`uv run --frozen python scripts/smoke.py --base-url http://127.0.0.1:8001`.
CI выполняет тот же smoke внутри контейнерного сценария и сохраняет ответы API и
логи контейнера в artifact `s1-smoke-<SHA>`; результаты Ruff/pytest — в job `quality`.

## Архитектура

Модульный монолит: `src/antifraud/` — будущие ML-модули, `backend/` — HTTP,
`backend/static/` — HTML/CSS/JS dashboard. Один сервис без БД и отдельной frontend-сборки.
ML extras: pandas, NumPy, scikit-learn, CatBoost; XAI: SHAP; notebooks: Jupyter.
Имя Python-пакета `ozon-antifraud` сохранено и не обязано совпадать с именем репозитория.
[Архитектурное решение](docs/architecture.md), [контракты](docs/contracts.md),
[план эксплуатации](docs/deployment.md).

## Команда и разработка

- Кирилл (@Kidukwe): Tech Lead / ML — данные, baseline, validation.
- Илья (@chilldonald): ML — XAI, LLM и оценка объяснений; совместный выбор данных и split.
- Максим (@HazDeen): MLOps — окружение, Docker, CI/CD и эксплуатация.
- Алина (@lina596): backend / fullstack.
- Ксюша (@ksy78-lang): fullstack / аналитика.

Одна постоянная ветка `main`; короткие ветки задач → PR в main → независимое review.
Релизы отмечаются тегами; develop и постоянных веток направлений нет.
[Правила PR](CONTRIBUTING.md) и [ответственность / DoD](docs/team-workflow.md).
Актуальные назначения и спринт ведёт организатор; этот README не дублирует Kanban.

Для S1: ветка `codex/S1-bootstrap-verification` → PR в `main`;
независимое review и повторный запуск выполняет Алина (@lina596).
[Отчёт S1, фактические логи и чек-лист приёмки](docs/s1-verification.md).

## Ограничения

Синтетические результаты не доказывают production-качество. Анонимизация не устраняет
утечки между train/test. Порог выбирается на validation с учётом FP/FN и бюджета проверки.
SHAP не доказывает причинность или факт фрода. Локальная LLM/LLM-as-a-Judge —
исследовательское дополнение для оценки объяснений, не источник истины.
VPS, публичное приложение и CD пока не развёрнуты.
