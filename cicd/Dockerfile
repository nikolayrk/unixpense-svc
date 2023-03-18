FROM node:current-alpine3.16

ARG PORT

WORKDIR /usr/src/app

COPY package*.json ./

COPY tsconfig.json ./

COPY src ./src

RUN npm ci

RUN npm run build && \
    rm -rf ./src && \
    rm tsconfig.json

EXPOSE $PORT

CMD [ "npm", "start" ]