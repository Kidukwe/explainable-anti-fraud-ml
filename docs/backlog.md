# Стартовый backlog (локальный, Issues не опубликованы)

Первый спринт: 1–2 недели, milestone M0. Цель — согласовать задачу, данные и контракты,
а не построить всю систему. Объём уточнить на командной встрече.

| ID | Задача | Owner / reviewer | Приёмка | Зависимости |
|---|---|---|---|---|
| S1-01 | Определить ML-задачу и сценарий использования | TL / ML | Единица наблюдения, target, момент score, стоимость FP/FN и ограничения согласованы | — |
| S1-02 | Требования к датасету и решение о синтетике | ML / TL | Data dictionary, label delay, imbalance, PII, provenance; решение synthetic/anonymized; генератор не пишем до review | 01 |
| S1-03 | Стратегия валидации | TL / ML | Temporal/group split, ограничения пересечения сущностей, train-only fit, test holdout, выбор порога и метрик описаны | 01,02 |
| S1-04 | Контракты ML ↔ API ↔ UI | FS1 / FS2+TL | Схемы запросов, ошибок, артефакта и метрик, примеры и версия приняты | 01,02 |
| S1-05 | Воспроизвести окружение и CI | MLOps / TL | Каждый запускает uv sync, pytest и compose; обсудить ветки/review; remote только с разрешением | — |
| S1-06 | Эскиз dashboard и интеграционные состояния | FS2 / FS1 | loading/empty/error/ready описаны и согласованы, нет придуманных метрик | 04 |

Следующие milestones (не первый спринт):
- M1: получить/создать согласованный датасет, первичный EDA, preprocessing и Logistic
  Regression baseline. Owner TL; ML review. DoD: reproducible notebook, no leakage.
- M2: Feature Engineering (ML/TL), Random Forest и CatBoost, сравнение и error analysis,
  порог по validation, SHAP и исследование калибровки. Отдельные небольшие experiments.
- M3: загрузка versioned bundle, inference API, metrics dashboard, ошибки и XAI UI.
- M4: VPS runbook, TLS/auth/access policy, ручной разрешённый deploy, затем CD с rollback.
- Research (после M2): оценка объяснений локальной LLM/LLM-as-a-Judge с human rubric,
  без объявления LLM источником истины; не блокирует M3/M4.

ML-задачи помечать learning-critical. Стартовый учебный пример S1-02/S1-03;
EDA issue заводить только когда входные данные и split определены.
