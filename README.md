# Event Planner

Веб-приложение для организации закрытых мероприятий.

Пользователь может зарегистрироваться, создать мероприятие, пригласить зарегистрированных пользователей, отслеживать статусы приглашений и управлять участниками. Приглашённые пользователи могут принять или отклонить участие, а администратор управляет пользователями и мероприятиями на уровне всей системы.

## Документация

- [Продуктовое описание](docs/PRODUCT.md)
- [Бэкенд и база данных](docs/BACKEND.md)
- [Фронтенд](docs/FRONTEND.md)

## Локальный запуск

`docker-compose.local.yaml` поднимает только инфраструктуру проекта:

- PostgreSQL на `localhost:5432`;
- Redis на `localhost:6379`.

Backend и frontend запускаются вручную через npm-команды из своих папок.

```bash
docker compose -f docker-compose.local.yaml up -d
```

```bash
cd backend
cp .env.example .env
npm ci
npm run start:dev
```

Проверка backend:

```bash
curl http://localhost:3000/api/v1/health
```

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev -- -p 3001
```

Frontend будет доступен на `http://localhost:3001`.

Для локального frontend-запуска API должен указывать на локальный backend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
SERVER_API_BASE_URL=http://localhost:3000/api/v1
```

## Технологический стек

### Backend

Основной выбор:

- **NestJS** — backend-фреймворк для модульной архитектуры приложения.
- **TypeORM** — ORM для работы с сущностями, связями и миграциями.
- **PostgreSQL** — основная реляционная база данных.

Используемые библиотеки:

- **class-validator / class-transformer** — валидация и преобразование DTO.
- **@nestjs/config** — конфигурация через переменные окружения.
- **@nestjs/passport + passport-jwt** — стандартный NestJS-подход к аутентификации через Passport strategies и guards.
- **@nestjs/jwt** — выпуск access и refresh токенов.
- **bcrypt** — хэширование паролей.
- **@nestjs/bullmq + bullmq** — очередь фоновых задач.
- **Redis** — хранилище задач для BullMQ.
- **nodemailer** — отправка email-уведомлений о приглашениях, изменениях и отменах мероприятий.

### Авторизация

Для авторизации используем стандартные решения NestJS:

- `AuthModule`;
- Passport strategies;
- guards для защиты роутов;
- decorators для получения текущего пользователя;
- `@nestjs/jwt` для выпуска и проверки токенов.

Базовый сценарий:

- пользователь входит по email и паролю;
- backend выдаёт access token на 15 минут и refresh token на 7 дней;
- токены хранятся в `httpOnly` cookies;
- frontend не хранит токены в `localStorage`;
- закрытые API защищаются JWT guard;
- обновление access token выполняется через refresh endpoint;
- refresh token хранится и инвалидируется через Redis;
- выход из системы очищает cookies и удаляет refresh-сессию из Redis.

Такой подход удобен для Next.js-приложения: браузер сам отправляет cookies, а токены не доступны из клиентского JavaScript.

### Database

- **PostgreSQL** — основное хранилище.
- Миграции ведём через TypeORM.
- Основные сущности: пользователи, мероприятия, участники мероприятия, уведомления, email-сообщения.

### Infrastructure

- **Docker** — сборка production-образов backend и frontend.
- **Docker Compose** — локально запускает PostgreSQL и Redis; в production запускает frontend, backend, PostgreSQL и Redis.
- **Redis** — используется BullMQ для фоновой обработки email-уведомлений.
- **GitHub Actions** — CI/CD пайплайн.
- **Docker Hub** — registry для собранных контейнеров.

### Frontend

Основной выбор:

- **Next.js** — frontend-фреймворк на React.
- **shadcn/ui** — набор переиспользуемых UI-компонентов, которые копируются в проект и кастомизируются локально.
- **Tailwind CSS** — utility-first CSS для стилизации интерфейса.

Используемые библиотеки:

- **React Hook Form** — работа с формами.
- **Zod** — схемы валидации форм и клиентских данных.
- **date-fns** — форматирование дат и времени.
- **lucide-react** — иконки для интерфейса.

### Testing

Базовый набор:

- **Jest** — unit-тесты backend-логики.
- **Supertest** — зависимость под API/e2e-проверки backend.

E2E-тесты браузерных сценариев пока не закладываем. На первом этапе достаточно unit/API-тестов и ручной проверки основных пользовательских потоков.

## Архитектурный подход

Проект сделан как два независимых приложения в одном репозитории:

- `backend` — NestJS API;
- `frontend` — Next.js web-приложение.

Общей monorepo-утилиты не используем. У каждого приложения свой `package.json`, свои зависимости и свои команды запуска.

Пакетный менеджер:

- **npm**.

Структура:

```text
event-planner/
  backend/
  deploy/
  frontend/
  .github/workflows/
  docs/
  vibe/
  docker-compose.local.yaml
  docker-compose.prod.yaml
  README.md
```

Бэкенд остаётся единым приложением с логическим разделением на модули:

- auth;
- users;
- events;
- participants;
- notifications;
- mail;
- dashboard;
- admin.

Email-уведомления отправляются через очередь:

- backend создаёт запись `email_messages`;
- backend добавляет задачу в BullMQ;
- BullMQ processor внутри backend-приложения обрабатывает задачу и отправляет письмо;
- результат отправки сохраняется в `email_messages`.

Worker не является отдельным сервисом и не собирается в отдельный Docker image. Он живёт внутри NestJS backend-приложения как фоновый обработчик очереди.

Mail provider:

- **Google SMTP** через env-настройки.

Локальный Docker Compose запускает:

- `postgres` — база данных;
- `redis` — очередь фоновых задач.

Backend и frontend в локальной разработке запускаются вручную через npm.

Фронтенд строится вокруг закрытой пользовательской зоны:

- личный кабинет;
- мои мероприятия;
- приглашения;
- я участвую;
- страница мероприятия;
- управление участниками;
- админ-панель.

## CI/CD

Для CI/CD используем GitHub Actions.

Базовый пайплайн:

- установить зависимости;
- прогнать backend lint/test/build;
- прогнать frontend lint/build;
- собрать Docker image для `backend`;
- собрать Docker image для `frontend`;
- запушить контейнеры в Docker Hub.

Docker Hub images:

- `grekas/event-planner-backend`;
- `grekas/event-planner-frontend`.

Автоматический деплой в production пока не делаем. Production-запуск выполняется вручную: контейнеры забираются из Docker Hub и запускаются на выбранном сервере.

## Production

Production-запуск описан в [deploy/README.md](deploy/README.md).

Коротко:

- `docker-compose.prod.yaml` запускает `postgres`, `redis`, `backend`, `frontend`;
- миграции запускаются отдельным compose-профилем `migrations`;
- nginx стоит на сервере вне Docker и проксирует:
  - `/api/v1/*` на backend `127.0.0.1:4000`;
  - остальные запросы на frontend `127.0.0.1:3001`;
- домен production: `planner.grekassoq.ru`.
