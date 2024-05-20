FROM node:20-buster-slim

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json

RUN npm install

COPY src src

EXPOSE 3001

CMD ["npm", "start"]
