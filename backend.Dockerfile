FROM node:24-slim

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

EXPOSE 3000

CMD ["npm", "start"]