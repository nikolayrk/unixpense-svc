FROM node:current-alpine3.16

WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json ./

COPY src ./src

ARG NODE_ENV

RUN yarn install --pure-lockfile && \
    npm run build && \
    rm -rf  ./src \
            tsconfig.json

ARG PORT

EXPOSE $PORT

CMD [ "npm", "start" ]