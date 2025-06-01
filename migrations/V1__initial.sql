CREATE TABLE "users" (
  "user_id" SERIAL PRIMARY KEY,
  "email" VARCHAR(128) UNIQUE NOT NULL,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "password" VARCHAR(128) NOT NULL,
  "two_factor_key" VARCHAR(128) NOT NULL
);

CREATE TABLE "roles" (
  "role_id" SERIAL PRIMARY KEY,
  "role_name" VARCHAR(32) UNIQUE NOT NULL
);

INSERT INTO roles ("role_name") VALUES ('access_admin');

CREATE TABLE "user_roles" (
  "user_id" INTEGER,
  "role_id" INTEGER,
  PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE "refresh_tokens" (
  "user_id" INTEGER,
  "refresh_token" VARCHAR(128) NOT NULL,
  "expiry" TIMESTAMPTZ DEFAULT (NOW()+'90 DAYS')
);

CREATE TABLE "tasks" (
  "task_id" INTEGER PRIMARY KEY,
  "team_id" integer NOT NULL,
  "status_id" INTEGER NOT NULL,
  "assigned_to_id" INTEGER,
  "task_name" varchar(32),
  "task_content" varchar(255)
);

CREATE TABLE "statuses" (
  "status_id" INTEGER PRIMARY KEY,
  "status_name" VARCHAR(32)
);

CREATE TABLE "history" (
  "history_id" INTEGER PRIMARY KEY,
  "task_id" integer NOT NULL,
  "status_id" integer NOT NULL,
  "assigned_to_id" integer,
  "timestamp" timestamptz NOT NULL DEFAULT 'now()'
);

CREATE TABLE "teams" (
  "team_id" INTEGER PRIMARY KEY,
  "team_owner_id" integer NOT NULL,
  "team_name" VARCHAR(32) NOT NULL
);

CREATE TABLE "user_teams" (
  "user_id" INTEGER,
  "team_id" INTEGER,
  PRIMARY KEY ("user_id", "team_id")
);

ALTER TABLE "user_roles" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_roles" ADD FOREIGN KEY ("role_id") REFERENCES "roles" ("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refresh_tokens" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_teams" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_teams" ADD FOREIGN KEY ("team_id") REFERENCES "teams" ("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks" ADD FOREIGN KEY ("team_id") REFERENCES "teams" ("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD FOREIGN KEY ("user_id") REFERENCES "teams" ("team_owner_id") ON UPDATE CASCADE;

ALTER TABLE "statuses" ADD FOREIGN KEY ("status_id") REFERENCES "tasks" ("status_id") ON UPDATE CASCADE;

ALTER TABLE "history" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("task_id") ON UPDATE CASCADE;

ALTER TABLE "history" ADD FOREIGN KEY ("assigned_to_id") REFERENCES "users" ("user_id") ON UPDATE CASCADE;

ALTER TABLE "history" ADD FOREIGN KEY ("status_id") REFERENCES "statuses" ("status_id") ON UPDATE CASCADE;