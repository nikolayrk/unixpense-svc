# Unixpense Tracker

<div style="display: flex; flex-direction: row;">

[![CI-CD](https://github.com/nikolayrk/unixpense-svc/actions/workflows/cicd.yml/badge.svg)](https://github.com/nikolayrk/unixpense-svc/actions/workflows/cicd.yml)
</div>

Unixpense Tracker is an automated expense tracker for (individual) clients of [UniCredit BulBank](https://www.unicreditbulbank.bg/en/individual-clients/).

The service is responsible for fetching and persisting new transaction data from emails sent by [UniCredit BulBank's Infodirect Service](https://www.unicreditbulbank.bg/en/individual-clients/everyday-banking/electronic-services/infodirect/), using the [Google APIs Node.js Client](https://github.com/googleapis/google-api-nodejs-client).

## Environment

Environment variables used by this project. `var` and `secret` refer to variables, which can be loaded from GitHub Actions via [Configuration Variables](https://docs.github.com/en/actions/learn-github-actions/variables#using-the-vars-context-to-access-configuration-variable-values) and [Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository), respectively.

| Name                              | Description                                   | Type        |
| --------------------------------- | --------------------------------------------- | ----------- |
| PORT                              | Server listening port. Default: 8000          | var         |
| NODE_ENV                          | Node environment. Default: development        | var         |
| LOG_LEVEL                         | Logger log level. Default: info               | var         |
| UNIXPENSE_HOST                    | Server host. Default: localhost:8000          | var         |
| UNIXPENSE_HOST_PREFIX             | Server subpath to load the API on. Optional.  | var         |
| MARIADB_HOST                      | Optional. Default: `$HOSTNAME`                | var         |
| MARIADB_PORT                      | Optional. Default: 3306                       | var         |
| MARIADB_USER                      | Optional.                                     | secret      |
| MARIADB_PASSWORD                  | Optional.                                     | secret      |
| MARIADB_DATABASE                  | Optional.                                     | var         |
| MARIADB_VOLUME_STORAGE_CLASS_NAME | MariaDB Kubernetes Storage Volume Class Name  | var         |
| LOKI_HOST                         | URL to Grafana Loki instance. Optional.       | var         |
| DOCKER_REPO                       | Docker Image Repository                       | var         |
| DOCKERHUB_USERNAME                | Docker Image Repository                       | secret      |
| DOCKERHUB_PASSWORD                | Docker Image Repository                       | secret      |
| KUBERNETES_URL                    | Kubernetes API URL                            | var         |
| KUBECONFIG                        | Kubernetes Config Resource                    | secret      |
| GOOGLE_OAUTH2_CLIENT_ID           | Google OAuth2 Client ID to use in CronJob     | secret      |
| GOOGLE_OAUTH2_CLIENT_SECRET       | Google OAuth2 Client Secret to use in CronJob | secret      |
| GOOGLE_OAUTH2_REDIRECT_URI        | Google OAuth2 Redirect URI to use in CronJob  | secret      |

## Google Environment

Since the app sources its transactions from Gmail, there are a couple of prerequisite steps you need to take to enable access to Gmail data:
1. [Create a Google Cloud Project](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
2. [Create Google OAuth Credentials](https://developers.google.com/workspace/guides/create-credentials#oauth-client-id)
    > **_NOTE:_** Make sure to store the **Client ID**, **Client Secret** and **Redirect URI** in the respective Encrypted Secrets

## Swagger

> **_NOTE:_**  In order to use Swagger, you have to add http://localhost:8000/swagger/oauth2-redirect.html as an additional redirect URI to your Google OAuth Credentials. The same route can be used with a public host, as well.

[Swagger UI](https://swagger.io/tools/swagger-ui/) is accessible through `http://localhost:8000/swagger/`. The specification is generated from source using [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express) and [swagger-jsdoc](https://www.npmjs.com/package/swagger-jsdoc).

## Logging

Centralized logging is provisioned by [Grafana Loki](https://grafana.com/oss/loki/) and implemented using [winston-loki](https://www.npmjs.com/package/winston-loki).

---
## REST API Setup

Running the project as a stand-alone REST API with no extra fluff can be achieved by using a combination of the below commands, depending on your use-case.

```bash
npm install # Install dependencies

npm run lint # Run linter

npm test # Run tests

npm run build # Build the project

npm start # Run the API server

npm run dev # Run in development mode

docker build -t nikolayrk/unixpense-svc:latest --build-arg=PORT=8000 # Build a Docker image

docker run nikolayrk/unixpense-svc:latest -d 8000:8000 --env-file .env # Run the image in a container
```

## Example API Usage

An example API call to fetch the last 5 transactions

### Request

`GET /api/transactions/gmail/get`

    curl -X 'GET' \
        'http://localhost:8000/api/transactions/gmail/get?last=5' \
        -H 'accept: */*' \
        -H 'clientId: <Google OAuth2 Client ID>' \
        -H 'Authorization: Bearer <Google OAuth2 Access Token>'

### Response

    HTTP/1.1 200 OK
    Date: Tue, 02 May 2023 17:49:03 GMT 
    Status: 200 OK
    Connection: close
    Content-Type: application/json
    Content-Length: 1337
    X-Powered-By: Express 

    [...]

---
## Service Setup

When ran as a service, a [CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/) periodically makes calls to the API in order to fetch and persists new transactions in the background and ensure timely data synchronization. The data can then be visualized in a [Grafana](https://grafana.com/grafana/) dashboard as a [MySQL data source](https://grafana.com/docs/grafana/latest/datasources/mysql/) and provide insights into the user's spending habits.

> **_NOTE:_** The current recommended way to setup all the necessary components needed for the service to function, is by using the GitHub Actions CI-CD workflow. There also exists a Jenkins pipeline, which was used in the past, but is now deprecated and does not contain all the steps available in the Actions workflow.

> **_NOTE:_** All variables and secrets need to have been configured in the GitHub repo's '**Actions secrets and variables**' Settings page, in order for the successful run of the workflow.

The Actions workflow consists of three jobs, the high-level operations of which are detailed below:

### Pre-build

1. Install dependencies
2. Run Linter
3. Run Tests

### Build

1. Authenticate with the Docker Registry
2. Build and push a Docker image to said Registry

### Deploy

1. Establish a connection to the Kubernetes API
2. Create Kubernetes Secrets for any sensitive app data
3. Create the necessary Kubernetes components for the app's deployment, persistence and networking

---
## Built using

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