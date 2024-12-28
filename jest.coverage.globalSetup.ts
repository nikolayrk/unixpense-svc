import "reflect-metadata";
import { DockerComposeEnvironment, Wait } from 'testcontainers';
import Constants from "@shared/constants";
import dotenv from 'dotenv'
import path from "path";

export default async () => {
    dotenv.config({ path: path.resolve(process.cwd(), '.env.coverage')});

    globalThis.dbContainer = await createDatabaseConstainerAsync();

    const mocks = await import('./src/mocks');

    await mocks.applyGoogleMocksAsync();
};

async function createDatabaseConstainerAsync() {
    const container = await new DockerComposeEnvironment('./', 'docker-compose.yml')
        .withWaitStrategy(`${Constants.DbComposeServiceName}-1`, Wait.forHealthCheck())
        .withEnvironment({
            'GOOGLE_OAUTH2_CLIENT_ID': process.env.GOOGLE_OAUTH2_CLIENT_ID!,
            'GOOGLE_OAUTH2_CLIENT_SECRET': process.env.GOOGLE_OAUTH2_CLIENT_SECRET!,
            'MARIADB_PASSWORD': process.env.MARIADB_PASSWORD!,
        })
        .up([Constants.DbComposeServiceName]);

    return container.getContainer(`${Constants.DbComposeServiceName}-1`);
}
