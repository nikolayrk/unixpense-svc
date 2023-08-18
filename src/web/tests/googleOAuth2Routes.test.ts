import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import * as supertest from 'supertest';
import { registerDependencies, startServerAsync, stopServerAsync } from '../../bootstrap';
import { createContainerDatabaseConnectionAsync, createMariaDbContainerAsync } from '../../core/tests/helpers';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import { StartedTestContainer } from 'testcontainers';
import { Server } from 'http';
import GoogleOAuth2TokensRepository from '../../googleOAuth2/repositories/googleOAuth2TokensRepository';
import { Sequelize } from 'sequelize';
import Constants from '../../constants';

describe('Google OAuth2 Routes Tests', () => {
    let container: StartedTestContainer;
    let connection: Sequelize;
    let app: Server;
    
    let googleOAuth2TokensRepository: GoogleOAuth2TokensRepository;

    beforeAll(async () => {
        process.env.GOOGLE_OAUTH2_CLIENT_ID = Constants.Mock.clientId;
        process.env.GOOGLE_OAUTH2_CLIENT_SECRET = Constants.Mock.clientSecret;
        
        registerDependencies();
        
        googleOAuth2TokensRepository = DependencyInjector.Singleton.resolve<GoogleOAuth2TokensRepository>(injectables.GoogleOAuth2TokensRepository);    
        
        container = await createMariaDbContainerAsync();
        connection = await createContainerDatabaseConnectionAsync(container);
        app = await startServerAsync();
    }, Constants.Defaults.containerTimeout);
    
    afterAll(async () => {
        await stopServerAsync(app);
        await connection.close();
        await container.stop();
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