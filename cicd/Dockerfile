FROM node:current-alpine3.16


WORKDIR /usr/app

COPY package.json yarn.lock tsconfig.json ./
COPY src ./src

EXPOSE 8000



FROM base as prod

ARG PRODUCTION

COPY --from=base /usr/app ./

RUN yarn install --frozen-lockfile --production=${PRODUCTION} && \
    yarn build && \
    rm -rf tsconfig.json ./src

RUN apk add --no-cache tini

USER node


ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "node", "dist/main.js" ]
