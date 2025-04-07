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

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthz || exit 1

USER node

CMD ["node", "authlet/dist/authlet/src/main.js"]