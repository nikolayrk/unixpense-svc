FROM node:current-alpine3.16

WORKDIR /usr/src/app

COPY package*.json ./

COPY tsconfig.json ./

COPY src ./src

RUN npm ci

ARG NODE_ENV

RUN npm run build && \
    mv ./dist/* ./ && \
    rm -rf  ./src \
            ./dist \
            tsconfig.json

ARG PORT

EXPOSE $PORT

CMD [ "npm", "start" ]