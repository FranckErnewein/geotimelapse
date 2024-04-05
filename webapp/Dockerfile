FROM node:20-buster-slim as build

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY tsconfig.json tsconfig.json
COPY tsconfig.node.json tsconfig.node.json
COPY vite.config.ts vite.config.ts
COPY index.html index.html
COPY src src

RUN npm run build

FROM caddy:2

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /app
