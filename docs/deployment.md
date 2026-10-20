# План VPS и CD

Локально доступны Dockerfile и compose: один непривилегированный сервис,
localhost port, healthcheck. Это не готовое публичное production-развёртывание.

После разрешения владельца MLOps выбирает VPS/домен, настраивает SSH least privilege,
firewall, TLS reverse proxy, доступ/auth и хранение секретов вне Git.
Сначала ручной deploy конкретной версии image и health smoke; затем GitHub environment
с protected approval и узким deploy credential. Не деплоить произвольный PR.
CD должен собирать versioned image, проходить CI, сохранять previous image,
проверять readiness после появления модели и уметь откатить image + bundle/schema.
Датасеты не включать в image. Model bundle поступает из доверенного источника;
pickle/joblib не загружать от недоверенных пользователей.

До внешних шагов: определить ресурсный бюджет, версию artifact, доступ к dashboard,
backup policy, retention и redaction логов. Prometheus/Grafana не обязательны для MVP.
Сейчас никаких SSH-ключей, registry push и CD secret не создано.
