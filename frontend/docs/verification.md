# Фактические проверки frontend

Дата: 03.11.2026. Проверяющий: Codex (AI), не независимая приёмка Алиной.
Изменения подготовлены в отдельной рабочей копии пользовательского frontend.
Backend, Dockerfile, Compose и зависимости проекта не изменялись.

## Выполнено

Среда: Windows, Node.js v24.22.1, Vitest 3.2.7, Vite 6.4.5.
Повторно использованы уже установленные локальные зависимости, без новых пакетов.

`npm test`: PASS.

```text
tests/configuration.test.js: 14 passed
tests/operation-check.test.jsx: 13 passed
tests/environment.test.jsx: 21 passed
tests/demo-workflow.test.jsx: 3 passed
Test Files: 4 passed
Tests: 51 passed
```

Реальный HTTP smoke Vite без backend:

```text
Dev: demo config/root OK without backend
Build: demo config.json OK
Dev: production config/root OK without backend
Build: production config.json OK
Preview: demo config/root OK without backend
Preview: production config/root OK without backend
```

Smoke проверяет /config.json, Cache-Control: no-store, HTML entrypoint,
генерацию JSON при сборке и доступность собранного JS в preview.
Это HTTP/build-проверка, не браузерная визуальная проверка.

`npm run build`: PASS, 35 модулей, dist/config.json и отдельный DemoApp chunk.
Итоговая обычная сборка использует demo по умолчанию.

Покрыто тестами:

- Настоящий DemoApp: баннер, переключатель, карточка первой операции.
- Сохранение открытой карточки при смене сценария и очистка старого ответа.
- Пустая очередь и нулевые счётчики, инициалы, заглушки изображений.
- Production без API: нет demo-инструментов, fake-операций или mock-fallback.
- Ошибки конфигурации/сети/JSON; неизвестный ENVIRONMENT — явная ошибка.
- Настроенный API: загрузка записей/пустой ответ/ошибка/повтор/открытие карточки.
- Защита при смене URL API, дубли ID и некорректные payload.
- Исходные 13 тестов семи состояний, гонок ответов и чужого operationId.

## Не выполнено / не подтверждено

- Скриншоты и визуальная проверка в браузере на desktop/mobile после переноса.
- Работа с реальным API/моделью, интеграция с FastAPI и Docker/Compose.
- Совместимость временного адаптера с конкретной согласованной версией draft.
- Удалённый CI после push новых изменений.
- Независимое review и фактическая проверка Алины.

При переносе в пользовательскую ветку повторить npm test и npm run build,
зафиксировать commit SHA и приложить скриншоты/демо по review-checklist.md.
