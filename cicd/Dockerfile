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

RUN apk add --no-cache tini

USER node

ENTRYPOINT ["/sbin/tini", "--"]

CMD [ "node", "dist/main.js" ]