FROM node:8.11.1

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --silent

COPY . .

ENV NODE_ENV=production

CMD ["npm", "run", "docker"]
