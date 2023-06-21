# Unixpense Tracker

<div style="display: flex; flex-direction: row;">

[![CI-CD](https://github.com/nikolayrk/unixpense-svc/actions/workflows/cicd.yml/badge.svg)](https://github.com/nikolayrk/unixpense-svc/actions/workflows/cicd.yml)
</div>

Unixpense Tracker is an automated expense tracker for (individual) clients of [UniCredit BulBank](https://www.unicreditbulbank.bg/en/individual-clients/).

The service is responsible for fetching and persisting new transaction data from emails sent by [UniCredit BulBank's Infodirect Service](https://www.unicreditbulbank.bg/en/individual-clients/everyday-banking/electronic-services/infodirect/) to a Gmail address. The data can then be visualized in a [Grafana](https://grafana.com/grafana/) dashboard and provide insights into the user's spending habits.

## Environment

Environment variables used by this project. `var` and `secret` refer to variables, which can be loaded from GitHub Actions via [Configuration Variables](https://docs.github.com/en/actions/learn-github-actions/variables#using-the-vars-context-to-access-configuration-variable-values) and [Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository), respectively.

| Name                              | Description                                        | Type        |
| --------------------------- | -------------------------------------------------------- | ----------- |
| PORT                        | Server listening port. Default: 8000                     | var         |
| NODE_ENV                    | Node environment. Default: development                   | var         |
| LOG_LEVEL                   | Logger log level. Default: info                          | var         |
| GMAIL_ADDRESS               | The Gmail address, containing the transaction emails     | var         |
| REDIS_NFS_SERVER            | Host / IP of the NFS server holding the Redis storage    | var         |
| REDIS_NFS_PATH              | Path to the Redis storage within the NFS server          | var         |
| UNIXPENSE_HOST              | Server host. Default: localhost:8000                     | var         |
| UNIXPENSE_HOST_PREFIX       | Server subpath to load the API on. Optional.             | var         |
| OAUTH2_PROXY_COOKIE_SECRET  | OAuth2 Proxy Cookie seed string                          | secret      |
| LOKI_HOST                   | URL to Grafana Loki instance. Optional.                  | var         |
| MARIADB_HOST                | Optional. Default: `$HOSTNAME`                           | var         |
| MARIADB_PORT                | Optional. Default: 3306                                  | var         |
| MARIADB_USER                | Optional.                                                | secret      |
| MARIADB_PASSWORD            | Optional.                                                | secret      |
| MARIADB_DATABASE            | Optional.                                                | var         |
| MARIADB_NFS_SERVER          | Host / IP of the NFS server holding the MariaDB database | var         |
| MARIADB_NFS_PATH            | Path to the MariaDB database within the NFS server       | var         |
| GOOGLE_OAUTH2_CLIENT_ID     | Client ID from [Creating Google Credentials](#creating-google-credentials)| secret      |
| GOOGLE_OAUTH2_CLIENT_SECRET | Client Secret from [Creating Google Credentials](#creating-google-credentials)| secret      |
| DOCKER_REPO                 | Docker Image Repository                                  | var         |
| DOCKERHUB_USERNAME          | Docker Image Repository                                  | secret      |
| DOCKERHUB_PASSWORD          | Docker Image Repository                                  | secret      |
| KUBERNETES_URL              | Kubernetes API URL                                       | var         |
| KUBECONFIG                  | Kubernetes Config Resource                               | secret      |
| CRONTAB                     | Cron schedule expression for the CronJob                 | var         |
| TELEGRAM_BOT_TOKEN          | Telegram Bot Token for sending notifications             | secret      |
| TELEGRAM_CHAT_ID            | Telegram Chat ID for sending notifications               | secret      |

## Basic Setup

```bash
npm install # Install dependencies

npm run lint # Run linter

npm test # Run tests

npm run build # Build the project

npm start # Run the API server

npm run dev # Run in development mode

docker build -t nikolayrk/unixpense-svc:latest --build-arg=PORT=8000 # Build a Docker image

docker run nikolayrk/unixpense-svc:latest -p 8000:8000 --env-file .env # Run the image in a container
```

## Creating Google Credentials

Google OAuth2 is used both for [Authentication](#authentication), as well as Authorization for `.../gmail` routes. In order to allow the app access to read data from Gmail, you need to perform the following steps:
1. [Create a Google Cloud Project](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
2. [Create Google OAuth Credentials](https://developers.google.com/workspace/guides/create-credentials#oauth-client-id)
    - _Credential type_: **OAuth client ID**
    - _Application type_: **Web application**
    - _Authorised JavaScript origins_: **http://localhost:8000** _(also applicable with a public host)_
    - _Authorised redirect URIs_: **http://localhost:8000/api/oauthcallback** _(also applicable with a public host)_
3. [Enable the Gmail API](https://cloud.google.com/endpoints/docs/openapi/enable-api)

## Swagger

> **_NOTE:_**  In order to use Swagger, you have to add http://localhost:8000/swagger/oauth2-redirect.html as an additional redirect URI to your Google OAuth Credentials. The same route can be used with a public host, as well.

[Swagger UI](https://swagger.io/tools/swagger-ui/) is accessible through `http://localhost:8000/swagger/`. The specification is generated from source.

# REST API

## Get the IDs of the requested number of latest Gmail transactions

*[Optional]* Constrain the result to a number of consecutively skipped entries

*[Optional]* Skip persisted entries

    GET /api/transactions/gmail/get/last/{last}?skip_depth={depth}&skip_saved={bool}
    <-  Array of Gmail Message IDs (transaction IDs)

## Resolve Gmail transactions by their respective transaction IDs

    POST /api/transactions/gmail/resolve
    ->   Array of transaction IDs to resolve
    <-   Array of Gmail transaction data objects

## Save the requested transactions to the database

    POST /api/transactions/gmail/save
    <-   Array of transaction IDs to save
    ->   { "message": "Added ... transaction(s) to database" }

## Create a new Transaction Group

    POST /api/groups
    <-   Group configuration object
    ->   { "message": "Added 1 group to database" }

## Get a Transaction Group and its Rules

    GET /groups/{group}
    ->  Group object

## Delete a Transaction Group

    DELETE /groups/{group}
    ->  Confirmation for the successfully deleted Group

## Get all Transaction Groups and their Rules

    GET /groups/all
    ->  Array of Group object

## Create a new Transaction Group Rule

    POST /api/groups/{group}/rules
    <-   Rule configuration object
    ->   { "message": "Added 1 group rule to database" }

## Get a Transaction Group Rule

    GET /groups/{group}/rules/{rule_id}
    ->  Group Rule object

## Delete a Transaction Group Rule

    DELETE /groups/{group}/rules/{rule_id}
    ->  Confirmation for the successfully deleted Rule

## Get all Transaction Group Rules for a Group

    GET /groups/{group}/rules/all
    ->  Group object

# Service

When ran as a service, a [CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/) periodically makes calls to the API in order to fetch and persists new transactions in the background and ensure timely data synchronization.

> **_NOTE:_** The current recommended way to setup all the necessary components needed for the service to function, is by using the GitHub Actions CI-CD workflow. There also exists a Jenkins pipeline, which was used in the past, but is now deprecated and does not contain all the steps available in the Actions workflow.

The Actions workflow consists of three jobs, the high-level operations of which are detailed below:

### Pre-build

1. Notify the workflow starting
2. Install dependencies
3. Run Linter
4. Run Tests

### Build

1. Authenticate with the Docker Registry
2. Build and push a Docker image to said Registry

### Deploy

1. Establish a connection to the Kubernetes API
2. Create Kubernetes Secrets for any sensitive app data
3. Create the necessary Kubernetes components for the app's deployment, persistence and networking

### Post-deploy

1. Notify the workflow finishing

Once done, take note of the **Client ID** and **Client Secret**.

## Authentication

Authentication is handled by [OAuth2 Proxy](https://github.com/oauth2-proxy/oauth2-proxy) using Google as the IdP and [Redis](https://redis.io/) for session storage.

> **_NOTE:_**  In order to use OAuth2 Authentication, you have to add https://_[UNIXPENSE_HOST]_/_[UNIXPENSE_HOST_PREFIX]_/oauth2/callback as an additional redirect URI to your Google OAuth Credentials.

## Persistence

The service uses an [NFS Volume](https://kubernetes.io/docs/concepts/storage/volumes/#nfs) for data persistence.

## Logging

Centralized logging is provisioned by [Grafana Loki](https://grafana.com/oss/loki/).

## Networking

The service is exposed via an [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) using the [NGINX Ingress Controller](https://github.com/kubernetes/ingress-nginx)

# Built using

- [Node.js](https://github.com/nodejs/node)
- [TypeScript](https://github.com/microsoft/TypeScript)
- [ts-node](https://github.com/TypeStrong/ts-node)
- [ESLint](https://github.com/eslint/eslint)
- [Jest](https://github.com/jestjs/jest)
- [Express](https://github.com/expressjs/express)
- [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client)
- [MariaDB](https://github.com/mariadb)
- [Sequelize](https://github.com/sequelize/sequelize)
- [InversifyJS](https://github.com/inversify/InversifyJS)
- [winston](https://github.com/winstonjs/winston)
- [winston-loki](https://github.com/JaniAnttonen/winston-loki)
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)