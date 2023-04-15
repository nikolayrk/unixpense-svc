FROM node:current-alpine3.16

ARG PORT

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

COPY tsconfig.json ./

COPY src ./src

RUN npm ci && \
    npm run build && \
    rm -rf  ./src \
            tsconfig.json

EXPOSE $PORT

CMD [ "npm", "start" ]