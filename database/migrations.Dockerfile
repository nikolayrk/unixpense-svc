ARG NODE_VERSION=20.13.0-alpine3.19

FROM node:${NODE_VERSION} AS base

WORKDIR /usr/app

# Copy only migration-specific files
COPY database/package.json database/yarn.lock database/tsconfig.json ./database/
COPY database/src ./database/src
COPY database/migrations ./database/migrations
COPY shared ./shared

# Install dependencies and create symlink for shared
RUN cd database && yarn install --frozen-lockfile && \
    ln -s /usr/app/database/node_modules /usr/app/node_modules && \
    yarn build && \
    rm -rf ./src ../shared

USER node

CMD ["node", "database/dist/database/src/main.js"]
