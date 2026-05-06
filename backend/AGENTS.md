# Backend Context

This directory contains the backend API for Event Planner.

Before implementing product behavior, read the project documentation:

- Product context: `../docs/PRODUCT.md`
- Backend services, API, database entities, and access rules: `../docs/BACKEND.md`
- Frontend expectations and route usage: `../docs/FRONTEND.md`
- Technology decisions: `../README.md`

Core project decisions:

- Use NestJS.
- Use npm.
- Use TypeORM with PostgreSQL.
- Use standard NestJS auth patterns: AuthModule, Passport strategies, guards, decorators, and `@nestjs/jwt`.
- Use JWT access and refresh tokens stored in httpOnly cookies.
- Access token lifetime: 15 minutes.
- Refresh token lifetime: 7 days.
- Store and invalidate refresh sessions in Redis.
- Use bcrypt for password hashing.
- Use `@nestjs/bullmq` + BullMQ + Redis for background jobs.
- BullMQ processors live inside the NestJS backend application.
- Do not create a separate worker service or a separate worker Docker image unless explicitly requested.
- Use Google as the mail provider.
- Backend and frontend are separate projects in one repository; do not introduce monorepo tooling.

Domain rules to preserve:

- Events are closed: only organizer, invited users, accepted participants, and admins can access an event.
- Invitations can be sent only to registered users.
- Organizer is stored on the event via `organizer_id`, not duplicated as a normal participant.
- Organizer should still appear in participant list responses as role `organizer`.
- Regular participant list responses include organizer and accepted participants.
- Organizer management responses may include invited, accepted, declined, and removed statuses.
- Do not add a separate participant status history table.
- Email notifications are part of the first version and should be queued through BullMQ, then processed by the backend application's in-process queue processor.

Testing guidance:

- Use Jest for backend unit tests.
- Use Supertest for API tests when needed.
- Do not add browser E2E testing unless explicitly requested.
