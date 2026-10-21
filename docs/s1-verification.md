# S1 · Проверка bootstrap, Git/PR/CI и запуска

Дата проверки: 21 октября 2026. Ветка: `feature/S1-bootstrap-verification`.
Основа опубликована в `main`: [bootstrap SHA fe8359cd1912b3c30b55919a1ccd2f9e8ba69e1d](https://github.com/Kidukwe/explainable-anti-fraud-ml/commit/fe8359cd1912b3c30b55919a1ccd2f9e8ba69e1d).
Предыдущий [PR #1 с отчётом bootstrap](https://github.com/Kidukwe/explainable-anti-fraud-ml/pull/1)
ещё открыт на момент проверки. Этот S1 дополняет его инструкцией и новыми проверками;
содержимое чужой ветки не менялось. SHA S1, PR и актуальный CI run приведены в описании PR S1.

## Критерии v1 и доказательства

| Критерий | Что проверено | Что остаётся |
|---|---|---|
| 1. Основа опубликована; правила main и коротких веток описаны | Bootstrap SHA выше; [README](../README.md), [CONTRIBUTING](../CONTRIBUTING.md), [командный процесс](team-workflow.md); снимок main ниже | Независимое review Алины, затем merge PR |
| 2. Качество, тесты, CI, контейнер или явный блокер | Чистая установка из lock, Ruff, форматирование, 5 тестов; [фактический локальный лог](evidence/s1/local-checks.txt). Docker локально отсутствует | CI run и контейнерный результат — в описании PR; Алина повторяет проверки |
| 3. Инструкция запуска показывает отсутствие модели | [Smoke-инструкция](../README.md#smoke-увидеть-отсутствие-модели), [HTTP smoke](evidence/s1/local-smoke.txt), [браузерная проверка](evidence/s1/browser-smoke.txt) | Алина повторяет smoke и фиксирует результат в review |

Состояние критериев не означает завершённую приёмку: review и повторный запуск
Алиной не выполнялись агентом и не подменяются результатами CI.

## Git и main

[Снимок GitHub API](evidence/s1/main-rules.json): `protected=true`, обязательный
check `quality` от GitHub Actions (app_id 15368), enforcement `everyone`.
Публичный endpoint не показывает все настройки review, force push и удаления;
их полная повторная проверка остаётся владельцу с admin-доступом. Доступ текущего
GitHub connector: push/triage, без admin/maintain. Настройки защиты не менялись.

Постоянная ветка — `main`. На задачу создаётся короткая ветка с реальным ID;
после независимого review и зелёного CI — squash merge и удаление task-ветки.
У bootstrap было разовое исключение для первого коммита; последующие изменения идут через PR.

## Что выполнено локально

macOS arm64, Python 3.12.7, uv 0.10.4. uv установлен в отдельное временное
окружение инструментов; глобальные настройки и зависимости проекта не менялись.
`uv sync --frozen` создал новую `.venv` из существующего `uv.lock`.
`uv run --frozen ruff check .`, `uv run --frozen ruff format --check .`,
`uv run --frozen pytest` прошли. Lock-файл не изменён.

Сервер запущен командой из README. `scripts/smoke.py` проверил:
health — 200; readiness — 503 / `model_not_implemented`;
metrics — 503 / `evaluation_not_run` / `metrics=null`; dashboard и Swagger — 200.
В браузере подтверждены фактические статусы, включая повторное нажатие «Обновить».

Локальный контейнерный блокер: команда `docker` отсутствует. Локальная сборка и
Compose не объявляются успешными. CI выполняет `docker compose config --quiet`,
сборку и запуск с healthcheck, затем тот же HTTP smoke. CI сохраняет `smoke.txt`
и `container.txt` в artifact `s1-smoke-<SHA>`; полный вывод установки, Ruff, pytest
и Docker build доступен в job `quality`. При сбое сначала смотреть упавший step.

## Повторный запуск Алиной

1. Получить ветку S1 по инструкции в описании PR и записать `git rev-parse HEAD`.
2. Выполнить локальный запуск из README с `uv sync --frozen` в новом окружении.
3. Запустить три проверки качества, затем `uv run --frozen python scripts/smoke.py`.
4. Открыть dashboard, нажать «Обновить» и сверить три текста из README.
5. Остановить сервер (`Ctrl+C`), выполнить контейнерные команды из README при
   установленном Docker Engine, повторить smoke, затем `docker compose down`.
6. В review указать SHA, ОС, версии Python/uv/Docker, команды, exit codes,
   видимые статусы, ссылку на CI run и приложить фактические логи.
   Если Docker недоступен, явно записать блокер и проверить контейнерный CI.

До подтверждения Алиной оставить открытыми:

- [ ] Независимое review инфраструктуры и Git-процесса.
- [ ] Повторный запуск качества/тестов/контейнера либо подтверждённый блокер.
- [ ] Повторный smoke: приложение работает, модель и метрики отсутствуют.
