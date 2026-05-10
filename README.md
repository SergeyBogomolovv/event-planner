# Event Planner

Event Planner — веб-приложение для организации закрытых мероприятий.

В приложении можно создать мероприятие, пригласить зарегистрированных пользователей, принять или отклонить приглашение, управлять участниками, получать уведомления и администрировать пользователей/мероприятия.

## Возможности

- Регистрация и вход по email/password.
- JWT auth через `httpOnly` cookies.
- Refresh-сессии в Redis.
- Создание и управление мероприятиями.
- Приглашения участников и статусы ответов.
- Уведомления внутри приложения.
- Email-уведомления через BullMQ и SMTP.
- Личный кабинет с ближайшими событиями и счетчиками.
- Админ-панель для пользователей и мероприятий.

## Стек

Backend:

- NestJS 11
- TypeORM
- PostgreSQL
- Redis
- BullMQ
- Passport JWT
- Nodemailer
- Jest

Frontend:

- Next.js 16 App Router
- React 19
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- date-fns
- lucide-react

Инфраструктура:

- Docker
- Docker Compose
- GitHub Actions
- Docker Hub
- nginx на сервере вне Docker

## Структура

```text
event-planner/
  backend/                  # NestJS API
  frontend/                 # Next.js app
  docs/                     # продуктовая и техническая документация
  vibe/                     # этапы реализации
  docker-compose.local.yaml # локальная инфраструктура
  docker-compose.prod.yaml  # production compose template
```

## Локальный запуск

Локально Docker Compose поднимает только PostgreSQL и Redis. Backend и frontend запускаются npm-командами.

```bash
docker compose -f docker-compose.local.yaml up -d
```

Backend:

```bash
cd backend
cp .env.example .env
npm ci
npm run start:dev
```

Проверка:

```bash
curl http://localhost:3000/api/v1/health
```

Frontend:

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev -- -p 3001
```

Для локального frontend-запуска `.env.local` должен указывать на backend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
SERVER_API_BASE_URL=http://localhost:3000/api/v1
```

Frontend будет доступен на `http://localhost:3001`.

## Команды

Backend:

```bash
cd backend
npm run lint
npm test -- --runInBand --watchman=false
npm run build
npm run migration:run
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Production

Production-запуск рассчитан на сервер, где:

- Docker Compose запускает `postgres`, `redis`, `backend`, `frontend`;
- nginx установлен на сервере вне Docker;
- nginx проксирует `/api/v1/*` на backend `127.0.0.1:4000`;
- остальные запросы nginx проксирует на frontend `127.0.0.1:3001`.

Production compose template лежит в [docker-compose.prod.yaml](docker-compose.prod.yaml).

Пример ручного обновления на сервере:

```bash
cd /opt/event-planner
docker compose pull
COMPOSE_PROFILES=migrations docker compose run --rm backend-migrations
docker compose up -d
docker image prune -f
```

## CI/CD

GitHub Actions workflow находится в [.github/workflows/ci.yml](.github/workflows/ci.yml).

На pull request workflow выполняет:

- backend lint/test/build;
- frontend lint/build.

На push в `main` workflow дополнительно:

- собирает Docker images;
- пушит images в Docker Hub;
- подключается к серверу по SSH;
- выполняет `docker compose pull`;
- запускает миграции;
- перезапускает контейнеры через `docker compose up -d`.

Docker Hub images:

- `grekas/event-planner-backend`
- `grekas/event-planner-frontend`

Для автодеплоя нужны GitHub Secrets:

- `DOCKERHUB_TOKEN`
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PORT`, если SSH работает не на `22`

CI не перезаписывает compose-файл на сервере. Production-секреты можно хранить прямо в `/opt/event-planner/docker-compose.yaml`.

## Назначить администратора

Сначала пользователь должен зарегистрироваться в приложении. После этого на сервере можно обновить роль по email:

```bash
cd /opt/event-planner
docker compose exec postgres \
  psql -U event_planner -d event_planner \
  -c "UPDATE users SET role = 'admin' WHERE email = 'user@example.com';"
```

Проверка:

```bash
docker compose exec postgres \
  psql -U event_planner -d event_planner \
  -c "SELECT email, role FROM users WHERE email = 'user@example.com';"
```

## Документация

- [Продуктовое описание](docs/PRODUCT.md)
- [Backend API и база данных](docs/BACKEND.md)
- [Frontend](docs/FRONTEND.md)
