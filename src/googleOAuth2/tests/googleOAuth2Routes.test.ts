import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import * as supertest from 'supertest';
import { createDatabaseConnectionAsync, registerDependencies, server } from '../../bootstrap';
import ILogger from '../../core/contracts/ILogger';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { Server } from 'http';
import { LogWaitStrategy } from 'testcontainers/dist/src/wait-strategy/log-wait-strategy';
import GoogleOAuth2TokensRepository from '../repositories/googleOAuth2TokensRepository';
import { Sequelize } from 'sequelize';
import Constants from '../constants';

describe('Google OAuth2 Routes Tests', () => {
    const mariadbPort = 3306;
    const mariadbRootPassword = 'password';
    const beforeAllTimeout = 30 * 1000; // 30s

    let logger: ILogger;
    let googleOAuth2TokensRepository: GoogleOAuth2TokensRepository;

    let container: StartedTestContainer | null = null;
    let connection: Sequelize | null = null;
    let app: Server | null = null;

    beforeAll(async () => {
        process.env.PORT = String(Math.round(Math.random() * (65535 - 1) + 1));
        process.env.GOOGLE_OAUTH2_CLIENT_ID = Constants.Mock.clientId;
        process.env.GOOGLE_OAUTH2_CLIENT_SECRET = Constants.Mock.clientSecret;

        registerDependencies();
        
        logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);
        googleOAuth2TokensRepository = DependencyInjector.Singleton.resolve<GoogleOAuth2TokensRepository>(injectables.GoogleOAuth2TokensRepository);    
        
        container = await new GenericContainer("mariadb")
            .withEnvironment({ "MARIADB_ROOT_PASSWORD": mariadbRootPassword })
            .withExposedPorts(mariadbPort)
            .withWaitStrategy(new LogWaitStrategy("mariadbd: ready for connections.", 1))
            .start();
        
        connection = await createDatabaseConnectionAsync(
            container.getHost(),
            container.getMappedPort(mariadbPort),
            'root',
            mariadbRootPassword,
            'unixpense',
            logger);
        
        app = server(logger);
    }, beforeAllTimeout);
    
    afterAll(async () => {
        app?.close();

        await connection?.close();
        
        await container?.stop();
    });

    it('should have credentials', async () => {
        const response = await supertest.agent(app)
            .post("/api/oauthcallback")
            .set('Accept', 'application/json')
            .send([]);

        expect(response.statusCode).toBe(401);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ error: "No credentials provided" });
    });

    it('should have valid credentials', async () => {
        const response = await supertest.agent(app)
            .post("/api/oauthcallback")
            .set('Accept', 'application/json')
            .send({
                client_id: "not_client_id",
                client_secret: "not_client_secret",
                redirect_uri: "not_redirect_uri",
                code: Constants.Mock.authorizationCode
            });

        expect(response.statusCode).toBe(401);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ error: "Mismatched credentials" });
    });

    it('should have an authorization code', async () => {
        const response = await supertest.agent(app)
            .post("/api/oauthcallback")
            .set('Accept', 'application/json')
            .send({
                client_id: Constants.Mock.clientId,
                client_secret: Constants.Mock.clientSecret,
                redirect_uri: Constants.Mock.redirectUri
            });

        expect(response.statusCode).toBe(403);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ error: "No authorization code provided" });
    });

    it('should update persisted oauth2 refresh tokens', async () => {
        await googleOAuth2TokensRepository.createOrUpdateAsync(Constants.Mock.userEmail, Constants.Mock.accessToken, "old_refresh_token");

        const response = await supertest.agent(app)
            .post("/api/oauthcallback")
            .set('Accept', 'application/json')
            .send({
                client_id: Constants.Mock.clientId,
                client_secret: Constants.Mock.clientSecret,
                redirect_uri: Constants.Mock.redirectUri,
                code: Constants.Mock.authorizationCode
            });

        const tokens = await googleOAuth2TokensRepository.getOrNullAsync(Constants.Mock.userEmail);

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ 
            access_token: Constants.Mock.accessToken,
            refresh_token: Constants.Mock.refreshToken
        });

        expect(tokens?.refreshToken).toEqual(Constants.Mock.refreshToken);
    });

    it('should handle authorization errors', async () => {
        const response = await supertest.agent(app)
            .post("/api/oauthcallback")
            .set('Accept', 'application/json')
            .send({
                client_id: Constants.Mock.clientId,
                client_secret: Constants.Mock.clientSecret,
                redirect_uri: Constants.Mock.redirectUri,
                code: Constants.Mock.authorizationCodeError
            });

        expect(response.statusCode).toBe(500);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ error: Constants.Mock.authorizationCodeError });
    });
});