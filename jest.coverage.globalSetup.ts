import "reflect-metadata";
import { DockerComposeEnvironment, Wait } from 'testcontainers';
import Constants from './src/constants';

export default async () => {
    process.env.NODE_ENV = 'test_coverage';
    process.env.GOOGLE_OAUTH2_CLIENT_ID = Constants.Mock.clientId;
    process.env.GOOGLE_OAUTH2_CLIENT_SECRET = Constants.Mock.clientSecret;

    globalThis.dbContainer = await createDatabaseConstainerAsync();

    const mocks = await import('./src/mocks');

    await mocks.applyGoogleMocksAsync();
};

async function createDatabaseConstainerAsync() {
    const container = await new DockerComposeEnvironment('./cicd/', 'docker-compose.yml')
        .withWaitStrategy(`${Constants.DbComposeServiceName}-1`, Wait.forHealthCheck())
        .withEnvironment({
            'GOOGLE_OAUTH2_CLIENT_ID': Constants.Mock.clientId,
            'GOOGLE_OAUTH2_CLIENT_SECRET': Constants.Mock.clientSecret,
            'MARIADB_PASSWORD': Constants.Defaults.mariadbPassword,
        })
        .up([Constants.DbComposeServiceName]);

    return container.getContainer(`${Constants.DbComposeServiceName}-1`);
}
