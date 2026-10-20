# Проверка инфраструктурного bootstrap

Дата: 20 октября 2026. Учебный проект, без данных и обученной модели.
Первый commit: [fe8359cd1912b3c30b55919a1ccd2f9e8ba69e1d](https://github.com/Kidukwe/explainable-anti-fraud-ml/commit/fe8359cd1912b3c30b55919a1ccd2f9e8ba69e1d),
`chore: bootstrap project infrastructure`.

## Фактические проверки

- Локально: `uv run ruff check .` и `uv run ruff format --check .` — успешно.
- Локально: `uv run pytest` — 5 passed, без warnings.
- Проверки выполнены на уже установленном окружении с `UV_NO_SYNC=1`;
  зависимости и lock-файл при bootstrap не изменялись.
- `docker compose config --quiet` — успешно. Локальный Docker Engine был выключен,
  поэтому свежая локальная сборка/smoke в этой задаче не выполнялись.
- [GitHub Actions run #1](https://github.com/Kidukwe/explainable-anti-fraud-ml/actions/runs/39415468485):
  `quality` — success; Ruff, pytest, Compose, Docker build и container smoke прошли на runner.
- Состав первого коммита: 44 проверенных текстовых файла. Данные/модели/venv/соседние
  workspace не включены. Проверены ignore rules, отсутствие symlinks, персональных путей
  и типовых credential patterns; это не гарантия обнаружения всех возможных секретов.
- API: liveness работает; readiness и метрики честно сообщают отсутствие ML-компонентов.
  Это не проверка качества ML и не развёртывание на VPS.

В PR с этой записью также убрана лишняя пустая строка в конце шаблона Pull Request,
обнаруженная `git diff --check`. Опубликованная история main не переписывалась.

## Git-процесс и границы

Main — единственная постоянная ветка. Последующие изменения идут в коротких task-ветках
через PR. Bootstrap в пустую main — разовое исключение, не рабочий способ обходить review.
Защита main после успешного первого CI проверена через GitHub API: PR, одно одобрение,
актуальный `quality` от GitHub Actions, enforcement для admin, force push и deletion запрещены.
Фактическое текущее состояние правил всегда проверять в GitHub: этот файл — снимок проверки.

Следующий шаг MLOps: после принятия write-доступа воспроизвести локальный запуск/Compose,
проверить этот PR и согласовать требования VPS. Покупки, SSH-ключи, registry push,
публичный deploy и CD credentials в bootstrap не выполнялись.
