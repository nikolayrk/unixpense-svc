FROM node:current-alpine3.16

WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json ./

COPY src ./src

ARG NODE_ENV

RUN yarn install --pure-lockfile --prod && \
    yarn build && \
    rm -rf  ./src \
            tsconfig.json

ARG PORT

EXPOSE $PORT

USER node

CMD [ "node", "dist/main.js" ]