ARG NODE_VERSION=20.13.0-alpine3.19

FROM node:${NODE_VERSION} AS base

WORKDIR /usr/app

# Copy only authlet-specific files
COPY authlet/package.json authlet/yarn.lock authlet/tsconfig.json ./authlet/
COPY authlet/src ./authlet/src
COPY shared ./shared

# Install dependencies and create symlink for shared
RUN cd authlet && yarn install --frozen-lockfile && \
    ln -s /usr/app/authlet/node_modules /usr/app/node_modules && \
    yarn build && \
    rm -rf ./src ../shared

USER node

CMD ["node", "authlet/dist/authlet/src/main.js"]