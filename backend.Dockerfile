FROM node:24-slim as builder

WORKDIR /app

COPY common/package*.json ./common/
WORKDIR /app/common
RUN npm ci

COPY common/src/ ./src/

WORKDIR /app
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm i

WORKDIR /app
COPY backend/src/ ./backend/src/

FROM flyway/flyway:latest

USER root
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app

WORKDIR /app/backend

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