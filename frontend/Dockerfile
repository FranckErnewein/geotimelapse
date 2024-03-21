FROM node:20-slim-buster

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0", "--port=5000"]
