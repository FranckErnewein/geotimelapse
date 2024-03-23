FROM node:20-buster-slim

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY . .

RUN npm run build

EXPOSE 4173

CMD [ "npm", "run" , "preview"]
