# Deploy Commands

## Запустить приложение

```bash
cd /opt/event-planner
docker compose pull
COMPOSE_PROFILES=migrations docker compose run --rm backend-migrations
docker compose up -d
```

## Сделать пользователя админом

Сначала пользователь должен зарегистрироваться в приложении.

```bash
cd /opt/event-planner
docker compose exec postgres \
  psql -U event_planner -d event_planner \
  -c "UPDATE users SET role = 'admin' WHERE email = 'user@example.com';"
```

## Обновление

```bash
cd /opt/event-planner
docker compose pull
COMPOSE_PROFILES=migrations docker compose run --rm backend-migrations
docker compose up -d
docker image prune -f
```

## Автообновление через GitHub Actions

Для deploy job нужны GitHub Secrets:

- `DOCKERHUB_TOKEN` — токен Docker Hub.
- `DEPLOY_HOST` — IP или домен сервера.
- `DEPLOY_USER` — SSH-пользователь на сервере.
- `DEPLOY_SSH_KEY` — приватный SSH-ключ без passphrase.
- `DEPLOY_PORT` — SSH-порт, если не `22`.

После push в `main` workflow:

- собирает и пушит Docker images;
- подключается к серверу по SSH;
- в `/opt/event-planner` выполняет `docker compose pull`, миграции и `docker compose up -d`.

CI не перезаписывает compose-файл на сервере, потому что production-секреты лежат прямо в нём.
