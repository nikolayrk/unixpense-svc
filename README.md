# Unixpense Tracker (Service)
<!--rehype:style=display: flex; height: 230px; align-items: center; justify-content: center; font-size: 38px;-->

[![CI-CD](https://github.com/nikolayrk/unixpense-svc/actions/workflows/cicd.yml/badge.svg)](https://github.com/nikolayrk/unixpense-svc/actions/workflows/cicd.yml)
[![Coverage](https://nikolayrk.github.io/unixpense-svc/coverage/badge.svg)](https://nikolayrk.github.io/unixpense-svc/coverage/index.html)

Unixpense Tracker is an automated expense tracker for (individual) clients of [UniCredit BulBank](https://www.unicreditbulbank.bg/en/individual-clients/).

The Service is responsible for fetching and persisting new transaction data from emails sent by [UniCredit BulBank's Infodirect Service](https://www.unicreditbulbank.bg/en/individual-clients/everyday-banking/electronic-services/infodirect/) to a Gmail address.

## Setup

### Commands

```bash
# Install dependencies
yarn install

# Run linter
yarn lint

# Docker Compose service operations
yarn up [db/app/unit_tests/coverage_tests]
yarn down [db/app/unit_tests/coverage_tests]

# Running tests
yarn test:unit
yarn test:integration # Make sure to run 'yarn up db app' to bring up the necessary services
yarn test:coverage

# Running the application
yarn build # Compile the project
yarn start # Run the application after compilation
yarn dev # Run in development mode without compilation
```

### Creating Google Credentials

Google OAuth2 is used both for [Authentication](#authentication), as well as Authorization for `.../gmail` routes. In order to allow the app access to read data from Gmail, you need to perform the following steps:
1. [Create a Google Cloud Project](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
2. [Create Google OAuth Credentials](https://developers.google.com/workspace/guides/create-credentials#oauth-client-id)
    - _Credential type_: **OAuth client ID**
    - _Application type_: **Web application**
    - _Authorised JavaScript origins_: *e.g* **http://localhost:8000**
    - _Authorised redirect URIs_: *e.g* **http://localhost:8000/api/oauthcallback**
3. [Enable the Gmail API](https://cloud.google.com/endpoints/docs/openapi/enable-api)

Once done, carry over the **Client ID** and **Client Secret** to a `.env` file using the variables defined in the `.env.sample` file.

### Swagger

> **_NOTE:_**  In order to use Swagger, you have to add *[your uri]/swagger/oauth2-redirect.html* as a redirect URI to your Google OAuth Credentials

[Swagger UI](https://swagger.io/tools/swagger-ui/) is accessible through the `/swagger` route. The specification is generated from source.

## Environment

The Types `var` and `secret` refer to [Configuration Variables](https://docs.github.com/en/actions/learn-github-actions/variables#using-the-vars-context-to-access-configuration-variable-values) and [Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository), respectively.

| Name                              | Description                                        | Type        |
| --------------------------- | -------------------------------------------------------- | ----------- |
| PORT                        | Server listening port. Default: 8000                     | var         |
| NODE_ENV                    | Node environment. Default: development                   | var         |
| LOG_LEVEL                   | Logger log level. Default: info                          | var         |
| GMAIL_ADDRESS               | The Gmail address, containing the transaction emails     | var         |
| REDIS_NFS_SERVER            | Host / IP of the NFS server holding the Redis storage    | var         |
| REDIS_NFS_PATH              | Path to the Redis storage within the NFS server          | var         |
| UNIXPENSE_HOST              | Server URL. Default: localhost:8000                      | var         |
| UNIXPENSE_HOST_PREFIX       | Subpath to load the API on. Optional.                    | var         |
| OAUTH2_PROXY_COOKIE_SECRET  | OAuth2 Proxy Cookie seed string                          | secret      |
| LOKI_HOST                   | URL to Grafana Loki instance. Optional.                  | var         |
| MARIADB_HOST                | Optional. Default: `$HOSTNAME`                           | var         |
| MARIADB_PORT                | Optional. Default: 3306                                  | var         |
| MARIADB_USER                | The username of your MariaDB user.                       | secret      |
| MARIADB_PASSWORD            | The password of your MariaDB user.                       | secret      |
| MARIADB_DATABASE            | Optional. Default: unixpense                             | var         |
| MARIADB_NFS_SERVER          | Host / IP of the NFS server holding the MariaDB database | var         |
| MARIADB_NFS_PATH            | Path to the MariaDB database within the NFS server       | var         |
| GOOGLE_OAUTH2_CLIENT_ID     | Client ID from [Creating Google Credentials](#creating-google-credentials)| secret      |
| GOOGLE_OAUTH2_CLIENT_SECRET | Client Secret from [Creating Google Credentials](#creating-google-credentials)| secret      |
| DOCKER_REPO                 | Docker Image Repository (username/image)                 | var         |
| DOCKER_REGISTRY_URL         | Docker Image Repository URL (e.g ghcr.io)                | var         |
| DOCKERHUB_USERNAME          | DockerHub username                                       | secret      |
| DOCKERHUB_PASSWORD          | DockerHub password                                       | secret      |
| KUBERNETES_URL              | Kubernetes API URL                                       | var         |
| KUBECONFIG                  | Kubernetes Config Resource                               | secret      |
| CRONTAB                     | Cron schedule expression for the CronJob                 | var         |
| TELEGRAM_BOT_TOKEN          | Telegram Bot Token for sending notifications             | secret      |
| TELEGRAM_CHAT_ID            | Telegram Chat ID for sending notifications               | secret      |

## Deployment

The necessary manifest files are located in the `/cicd/manifests/` directory. They are applied with the [CICD](.github/workflows/cicd.yml) workflow.

### Authentication

> **_NOTE:_**  In order to use OAuth2 Authentication, you have to add *[your uri]/oauth2/callback* as a redirect URI to your Google OAuth Credentials.

Authentication is handled by [OAuth2 Proxy](https://github.com/oauth2-proxy/oauth2-proxy) using Google as the IdP and [Redis](https://redis.io/) for session storage.

### Persistence

An [NFS Volume](https://kubernetes.io/docs/concepts/storage/volumes/#nfs) is used for data persistence. A [CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/) periodically makes calls to the API in order to fetch and persists new transactions in the background and ensure timely data synchronization.

### Logging

Centralized logging is provisioned by [Grafana Loki](https://grafana.com/oss/loki/).

### Networking

The Service is exposed via an [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) using the [NGINX Ingress Controller](https://github.com/kubernetes/ingress-nginx)

## Built using

- [Node.js](https://github.com/nodejs/node)
- [Yarn](https://github.com/yarnpkg/berry)
- [TypeScript](https://github.com/microsoft/TypeScript)
- [ts-node](https://github.com/TypeStrong/ts-node)
- [ESLint](https://github.com/eslint/eslint)
- [Express](https://github.com/expressjs/express)
- [Jest](https://github.com/jestjs/jest)
- [Axios](https://github.com/axios/axios)
- [Nock](https://github.com/nock/nock)
- [Testcontainers](https://github.com/testcontainers/testcontainers-node)
- [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client)
- [MariaDB](https://github.com/mariadb)
- [Sequelize](https://github.com/sequelize/sequelize)
- [Umzug](https://github.com/sequelize/umzug)
- [InversifyJS](https://github.com/inversify/InversifyJS)
- [winston](https://github.com/winstonjs/winston)
- [winston-loki](https://github.com/JaniAnttonen/winston-loki)
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)
- [Docker](https://github.com/docker)
- [Kubernetes](https://github.com/kubernetes)