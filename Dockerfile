ARG NODE_VERSION=20.13.0-alpine3.19

FROM node:${NODE_VERSION} AS base

WORKDIR /usr/app

COPY package.json yarn.lock tsconfig.json ./
COPY src ./src
COPY Dockerfile .dockerignore docker-compose.yml ./
COPY __tests__ ./__tests__
COPY jest.config.js \
     jest.coverage.config.js \
     jest.coverage.globalSetup.ts \
     jest.coverage.globalTeardown.ts \
     jest.setup.ts ./

EXPOSE 8000

FROM base as test

WORKDIR /usr/app

COPY --from=base /usr/app ./

RUN yarn install --fronzen-lockfile --production=false

RUN apk update && apk upgrade && apk --no-cache add docker-cli-compose

CMD [ "yarn", "test:unit" ]

FROM base as prod

ARG PRODUCTION

COPY --from=base /usr/app ./

RUN yarn install --frozen-lockfile --production=${PRODUCTION} && \
    yarn build && \
    rm -rf tsconfig.json ./src \
        Dockerfile .dockerignore docker-compose.yml \
        ./__tests__ \
        jest.config.js \
        jest.coverage.config.js \
        jest.coverage.globalSetup.ts \
        jest.coverage.globalTeardown.ts \
        jest.setup.ts

RUN apk add --no-cache tini

USER node

HEALTHCHECK --interval=5s --timeout=10s --retries=3 --start-period=5s \
    CMD wget -q --spider http://localhost:8000/healthz || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "node", "dist/main.js" ]
