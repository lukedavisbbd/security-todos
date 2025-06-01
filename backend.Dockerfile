FROM node:24-slim as builder

WORKDIR /app

COPY common/package*.json ./common/
COPY common/tsconfig.json ./common/
WORKDIR /app/common
RUN npm ci

COPY common/src/ ./src/
RUN npm run build

WORKDIR /app
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
WORKDIR /app/backend
RUN npm i

WORKDIR /app
COPY backend/src/ ./backend/src/

WORKDIR /app/backend
RUN npm run build

FROM flyway/flyway:latest

USER root
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/common ./common

COPY --from=builder /app/backend/package*.json ./
RUN npm i

COPY --from=builder /app/backend/dist ./dist

COPY migrations /flyway/sql

RUN echo '#!/bin/bash\n\
set -e\n\
echo "Running database migrations..."\n\
flyway -url="jdbc:postgresql://${DB_HOST}/${DB_NAME}" \
       -user="${DB_USER}" \
       -password="${DB_PASSWORD}" \
       -locations="filesystem:/flyway/sql" \
       migrate\n\
echo "Starting application..."\n\
exec npm start' > /start.sh && chmod +x /start.sh

EXPOSE 3000

ENTRYPOINT ["/start.sh"]
CMD []