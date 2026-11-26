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

## Локальная проверка обновления и отката

Нужны работающий Docker Engine, Docker Compose с поддержкой `up --wait`, Git и
curl. Запускайте команды из корня репозитория. По умолчанию стенд доступен на
`127.0.0.1:18000`. Если порт занят, задайте `DEMO_PORT` перед запуском.

- Предыдущий образ — `antifraud-demo:9e2a130` из коммита MLAF-7.
- Новый образ — `antifraud-demo:86d70eb` из версии `main` на начало проверки.

Команды собирают два образа из зафиксированных коммитов. Временный Compose override
задаёт тег для сервиса `app`, сохраняя настройки и healthcheck из
`docker-compose.yml`. Каждый запуск сверяет ID контейнерного образа с ID выбранного
тега, ждёт статуса `healthy` и проверяет HTTP 200 от `/healthz`. Этот эндпоинт
доступен без обученной модели. После прогона Compose удаляет тестовые контейнер
и сеть, а оба образа остаются локально.

```bash
bash <<'BASH'
set -euo pipefail

old_rev=9e2a13042a217a02e57360d11cb01dfdac1e74e0
new_rev=86d70ebd7b6cd410b886c018bcf7c784c4a01e76
old_image=antifraud-demo:9e2a130
new_image=antifraud-demo:86d70eb
port=${DEMO_PORT:-18000}
project=antifraud-rollback-$$
tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/antifraud-rollback.XXXXXX")
override="$tmp_dir/compose.yml"

cat > "$override" <<'YAML'
services:
  app:
    image: "${DEMO_IMAGE:?set DEMO_IMAGE}"
YAML

compose() {
  DEMO_IMAGE="$1" APP_PORT="$port" docker compose \
    -p "$project" -f docker-compose.yml -f "$override" "${@:2}"
}

cleanup() {
  compose "$old_image" down
  rm -f "$override" "$tmp_dir/health.json"
  rmdir "$tmp_dir"
}
trap cleanup EXIT

git archive "$old_rev" | docker build --tag "$old_image" -
git archive "$new_rev" | docker build --tag "$new_image" -
old_id=$(docker image inspect --format '{{.Id}}' "$old_image")
new_id=$(docker image inspect --format '{{.Id}}' "$new_image")
if [ "$old_id" = "$new_id" ]; then
  echo "Оба тега указывают на один образ" >&2
  exit 1
fi

verify() {
  local stage=$1 image=$2 expected_id=$3
  local container status
  printf '\n--- %s ---\n' "$stage"
  compose "$image" up -d --no-build --pull never --wait --wait-timeout 90 app
  container=$(compose "$image" ps -q app)
  test "$(docker inspect --format '{{.Image}}' "$container")" = "$expected_id"
  docker inspect --format 'image={{.Config.Image}} id={{.Image}} health={{.State.Health.Status}}' "$container"
  status=$(curl --silent --show-error --fail --max-time 5 \
    --output "$tmp_dir/health.json" --write-out '%{http_code}' \
    "http://127.0.0.1:$port/healthz")
  test "$status" = 200
  printf 'GET /healthz HTTP %s\n' "$status"
  cat "$tmp_dir/health.json"
  printf '\n'
}

docker version --format 'Docker Engine {{.Server.Version}}'
docker compose version
verify baseline "$old_image" "$old_id"
verify update "$new_image" "$new_id"
verify rollback "$old_image" "$old_id"
BASH
```

### Результат локального прогона

27 ноября 2026, Apple Silicon, Linux ARM64 в локальной VM Lima. Вывод
сокращён до этапов проверки и ответов сервиса. ID образов в вашем прогоне
могут отличаться. ID на этапах `baseline` и `rollback` должны совпасть,
а на этапе `update` — отличаться.

```text
Docker Engine 29.10.1
Docker Compose version v5.8.0
--- baseline ---
image=antifraud-demo:9e2a130 id=sha256:dfb890503bef4ded18793dd7ef557c17f9d21cdf5df0ac201073b87b239c2b31 health=healthy
GET /healthz HTTP 200
{"status":"ok","service":"antifraud"}
--- update ---
image=antifraud-demo:86d70eb id=sha256:938b1e0cd99b66caebdd74151cc162879213d239f73f45615d4291a10f30baf3 health=healthy
GET /healthz HTTP 200
{"status":"ok","service":"antifraud"}
--- rollback ---
image=antifraud-demo:9e2a130 id=sha256:dfb890503bef4ded18793dd7ef557c17f9d21cdf5df0ac201073b87b239c2b31 health=healthy
GET /healthz HTTP 200
{"status":"ok","service":"antifraud"}
```
