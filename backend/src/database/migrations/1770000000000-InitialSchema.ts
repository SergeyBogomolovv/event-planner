import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1770000000000 implements MigrationInterface {
  name = 'InitialSchema1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(
      `CREATE TYPE "users_role_enum" AS ENUM ('user', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TYPE "users_status_enum" AS ENUM ('active', 'blocked')`,
    );
    await queryRunner.query(
      `CREATE TYPE "events_format_enum" AS ENUM ('offline', 'online', 'hybrid')`,
    );
    await queryRunner.query(
      `CREATE TYPE "events_status_enum" AS ENUM ('draft', 'active', 'cancelled', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "event_participants_status_enum" AS ENUM ('invited', 'accepted', 'declined', 'removed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "notifications_type_enum" AS ENUM ('event_invitation', 'event_updated', 'event_cancelled', 'participant_accepted', 'participant_declined')`,
    );
    await queryRunner.query(
      `CREATE TYPE "email_messages_type_enum" AS ENUM ('event_invitation', 'event_updated', 'event_cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "email_messages_status_enum" AS ENUM ('pending', 'sent', 'failed')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "name" character varying NOT NULL,
        "role" "users_role_enum" NOT NULL DEFAULT 'user',
        "status" "users_status_enum" NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizer_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "ends_at" TIMESTAMP WITH TIME ZONE,
        "location" character varying,
        "format" "events_format_enum" NOT NULL,
        "participant_limit" integer,
        "status" "events_status_enum" NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "event_participants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "status" "event_participants_status_enum" NOT NULL,
        "invited_by" uuid NOT NULL,
        "invited_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "responded_at" TIMESTAMP WITH TIME ZONE,
        "removed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_participants_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_event_participants_event_user" UNIQUE ("event_id", "user_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" "notifications_type_enum" NOT NULL,
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "related_event_id" uuid,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "email_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "email" character varying NOT NULL,
        "type" "email_messages_type_enum" NOT NULL,
        "subject" character varying NOT NULL,
        "body" text NOT NULL,
        "status" "email_messages_status_enum" NOT NULL DEFAULT 'pending',
        "related_event_id" uuid,
        "sent_at" TIMESTAMP WITH TIME ZONE,
        "failed_at" TIMESTAMP WITH TIME ZONE,
        "failure_reason" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_messages_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_events_organizer_id" ON "events" ("organizer_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_events_starts_at" ON "events" ("starts_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_events_status" ON "events" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_event_participants_event_id" ON "event_participants" ("event_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_event_participants_user_id" ON "event_participants" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_event_participants_status" ON "event_participants" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_related_event_id" ON "notifications" ("related_event_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_read_at" ON "notifications" ("read_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_messages_user_id" ON "email_messages" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_messages_status" ON "email_messages" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_messages_related_event_id" ON "email_messages" ("related_event_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "events" ADD CONSTRAINT "FK_events_organizer" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_participants" ADD CONSTRAINT "FK_event_participants_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_participants" ADD CONSTRAINT "FK_event_participants_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_participants" ADD CONSTRAINT "FK_event_participants_invited_by" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_related_event" FOREIGN KEY ("related_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" ADD CONSTRAINT "FK_email_messages_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" ADD CONSTRAINT "FK_email_messages_related_event" FOREIGN KEY ("related_event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_messages" DROP CONSTRAINT "FK_email_messages_related_event"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" DROP CONSTRAINT "FK_email_messages_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_related_event"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_participants" DROP CONSTRAINT "FK_event_participants_invited_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_participants" DROP CONSTRAINT "FK_event_participants_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "event_participants" DROP CONSTRAINT "FK_event_participants_event"`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" DROP CONSTRAINT "FK_events_organizer"`,
    );
    await queryRunner.query(`DROP TABLE "email_messages"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "event_participants"`);
    await queryRunner.query(`DROP TABLE "events"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "email_messages_status_enum"`);
    await queryRunner.query(`DROP TYPE "email_messages_type_enum"`);
    await queryRunner.query(`DROP TYPE "notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "event_participants_status_enum"`);
    await queryRunner.query(`DROP TYPE "events_status_enum"`);
    await queryRunner.query(`DROP TYPE "events_format_enum"`);
    await queryRunner.query(`DROP TYPE "users_status_enum"`);
    await queryRunner.query(`DROP TYPE "users_role_enum"`);
  }
}
