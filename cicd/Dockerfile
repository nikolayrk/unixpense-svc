FROM node:current-alpine3.16

ARG PORT

WORKDIR /usr/src/app

COPY package*.json ./

COPY tsconfig.json ./

COPY .eslintrc.js ./

COPY .eslintignore ./

COPY src ./src

RUN npm ci && \
    npm run lint && \
    npm run build && \
    rm -rf ./src \
            tsconfig.json \
            .eslintrc.js \
            .eslintignore

EXPOSE $PORT

CMD [ "npm", "start" ]