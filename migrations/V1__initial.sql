
CREATE TABLE users (
    "user_id" SERIAL PRIMARY KEY,
    "name" VARCHAR(64) NOT NULL,
    "email" VARCHAR(128) NOT NULL UNIQUE,
    "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
    "password" VARCHAR(128) NOT NULL,
    "two_factor_key" VARCHAR(128) NOT NULL
);

CREATE TABLE roles (
    "role_id" SERIAL PRIMARY KEY,
    "role_name" VARCHAR(32) NOT NULL UNIQUE
);

INSERT INTO roles ("role_name") VALUES ('access_admin');

CREATE TABLE user_roles (
    "user_id" INTEGER REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    "role_id" INTEGER REFERENCES roles(role_id) ON UPDATE CASCADE ON DELETE CASCADE,
    PRIMARY KEY ("user_id", "role_id")
);

CREATE TABLE refresh_tokens (
    "user_id" INTEGER REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    "refresh_token" VARCHAR(128) NOT NULL,
    "expiry" TIMESTAMPTZ DEFAULT (NOW() + '90 DAYS')
);
