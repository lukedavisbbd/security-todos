FROM node:24-slim as builder

WORKDIR /app

COPY common/package*.json ./common/
COPY common/tsconfig.json ./common/
WORKDIR /app/common
RUN npm ci
COPY common/src/ ./src/
RUN npm run build

WORKDIR /app
COPY frontend/package*.json ./frontend/
COPY frontend/tsconfig*.json ./frontend/
COPY frontend/vite.config.ts ./frontend/
WORKDIR /app/frontend
RUN npm i

WORKDIR /app
COPY frontend/src/ ./frontend/src/
COPY frontend/index.html ./frontend/
COPY frontend/public/ ./frontend/public/

WORKDIR /app/frontend
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]