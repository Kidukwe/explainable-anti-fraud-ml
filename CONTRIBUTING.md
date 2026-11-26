# Совместная работа

Репозиторий: [Kidukwe/explainable-anti-fraud-ml](https://github.com/Kidukwe/explainable-anti-fraud-ml).
Одна задача → короткая ветка → PR → независимое ревью → squash merge в `main`.
`main` — единственная постоянная ветка. Не создавать `develop` и постоянные ветки
`ml`, `backend` или `mlops`. Версии для защиты/демо отмечать согласованными тегами.

Ветка: `feature/<реальный-ID>-<topic>`, `fix/<реальный-ID>-<topic>` или
`experiment/<реальный-ID>-<topic>`.
ID брать из фактической задачи (например, MLAF), не выдумывать и не создавать пустые
ветки заранее. В PR указывать ссылку на задачу и base `main`.

Единственное исключение прямой записи в пустую `main` — первый инфраструктурный commit:
`chore: bootstrap project infrastructure`. После bootstrap изменения идут через PR.
Стадировать только проверенные файлы репозитория; перед коммитом смотреть
`git diff --cached --stat` и `git diff --cached --check`, а не добавлять родительскую папку.

Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`.
PR содержит проблему, изменение поведения, способ проверки и ограничения; связывается с Issue.
Избегайте больших смешанных PR. Незавершённые гипотезы оформляйте draft.

Перед PR: `uv sync --frozen`, `uv run ruff check .`, `uv run ruff format --check .`,
`uv run pytest`. При изменении Docker: `docker compose config --quiet` и container smoke.
Для ML-веток: `uv sync --frozen --extra ml --extra notebooks`.
Зависимости меняем в pyproject и обновляем uv.lock; замороженный запуск не должен менять lock.
Notebook должен воспроизводиться сверху вниз и не содержать персональные данные/секреты в outputs.

Минимум один независимый reviewer; автор не одобряет свой PR. ML/валидацию ревьюит
другой ML Engineer или Tech Lead; инфраструктуру — MLOps; контракт API — оба Fullstack
и потребитель ML. Блокирующие замечания закрыты, CI зелёный, DoD выполнен.
При отсутствии владельца ревью согласуется на стендапе, назначение — не молчаливое.

Issue: цель, входы/выходы, acceptance criteria, один accountable owner, labels,
зависимости и ожидаемое доказательство проверки. Эксперимент может закончиться
отрицательным результатом; это не причина скрывать метрики.
Полный DoD и роли: docs/team-workflow.md. Чувствительные данные не отправлять AI.
