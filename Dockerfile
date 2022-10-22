FROM node:current-alpine3.16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . /usr/src/app

RUN npm run lint

CMD [ "npm", "start" ]