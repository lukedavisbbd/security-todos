CREATE TABLE "users" (
    "user_id" SERIAL PRIMARY KEY,
    "name" VARCHAR(64) NOT NULL,
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
    "user_id" INTEGER REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    "role_id" INTEGER REFERENCES "roles" ("role_id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE "refresh_tokens" (
    "user_id" INTEGER REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    "refresh_token" VARCHAR(128),
    "expiry" TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 DAYS'),
    PRIMARY KEY ("user_id", "refresh_token")
);

CREATE TABLE "teams" (
    "team_id" SERIAL PRIMARY KEY,
    "team_owner_id" INTEGER NOT NULL REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    "team_name" VARCHAR(32) NOT NULL
);

CREATE TABLE "statuses" (
    "status_id" SERIAL PRIMARY KEY,
    "status_name" VARCHAR(32) UNIQUE NOT NULL
);

CREATE TABLE "tasks" (
    "task_id" SERIAL PRIMARY KEY,
    "team_id" INTEGER NOT NULL REFERENCES "teams" ("team_id") ON DELETE CASCADE ON UPDATE CASCADE,
    "status_id" INTEGER NOT NULL REFERENCES "statuses" ("status_id") ON DELETE CASCADE ON UPDATE CASCADE,
    "assigned_to_id" INTEGER REFERENCES "users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    "task_name" VARCHAR(32) NOT NULL,
    "task_content" VARCHAR(255) NOT NULL
);

CREATE TABLE "history" (
    "history_id" SERIAL PRIMARY KEY,
    "task_id" INTEGER NOT NULL REFERENCES "tasks" ("task_id") ON DELETE CASCADE ON UPDATE CASCADE,
    "status_id" INTEGER NOT NULL REFERENCES "statuses" ("status_id") ON DELETE CASCADE ON UPDATE CASCADE,
    "assigned_to_id" INTEGER REFERENCES "users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "user_teams" (
    "user_id" INTEGER REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE,
    "team_id" INTEGER REFERENCES "teams" ("team_id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("user_id", "team_id")
);
CREATE TABLE "teams" (
"team_id" SERIAL PRIMARY KEY,
"team_owner_id" INTEGER NOT NULL,
"team_name" VARCHAR(32) NOT NULL
);
CREATE TABLE "statuses" (
"status_id" SERIAL PRIMARY KEY,
"status_name" VARCHAR(32)
);
CREATE TABLE "tasks" (
"task_id" SERIAL PRIMARY KEY,
"team_id" INTEGER NOT NULL,
"status_id" INTEGER NOT NULL,
"assigned_to_id" INTEGER,
"task_name" VARCHAR(32),
"task_content" VARCHAR(255)
);
CREATE TABLE "history" (
"history_id" SERIAL PRIMARY KEY,
"task_id" INTEGER NOT NULL,
"status_id" INTEGER NOT NULL,
"assigned_to_id" INTEGER,
"timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
ALTER TABLE "teams" ADD FOREIGN KEY ("team_owner_id") REFERENCES "users" ("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD FOREIGN KEY ("team_id") REFERENCES "teams" ("team_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD FOREIGN KEY ("status_id") REFERENCES "statuses" ("status_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD FOREIGN KEY ("assigned_to_id") REFERENCES "users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "history" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("task_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "history" ADD FOREIGN KEY ("status_id") REFERENCES "statuses" ("status_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "history" ADD FOREIGN KEY ("assigned_to_id") REFERENCES "users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE;