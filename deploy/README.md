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
