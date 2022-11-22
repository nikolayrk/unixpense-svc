FROM node:current-alpine3.16

ARG PORT

WORKDIR /usr/src/app

COPY package*.json ./

COPY tsconfig.json ./

COPY src ./src

RUN npm ci

COPY . /

RUN npm run build

EXPOSE $PORT

CMD [ "npm", "start" ]