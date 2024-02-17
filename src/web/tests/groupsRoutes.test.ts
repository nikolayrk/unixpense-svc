import { describe, it, beforeEach, beforeAll, afterAll, expect } from '@jest/globals';
import * as supertest from 'supertest';
import { registerDependencies, startServerAsync, stopServerAsync } from '../../bootstrap';
import { createContainerDatabaseConnectionAsync, createMariaDbContainerAsync } from '../../core/utils/databaseContainerUtils';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import { StartedTestContainer, Wait } from 'testcontainers';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import Constants from '../../constants';

describe('Groups Routes Tests', () => {
    let container: StartedTestContainer;
    let connection: Sequelize;
    let app: Server;

    beforeAll(async () => {
        registerDependencies();

        // container = await createMariaDbContainerAsync();
        // connection = await createContainerDatabaseConnectionAsync(container);
        app = await startServerAsync();
    }, Constants.Defaults.containerTimeout);
    
    afterAll(async () => {
        await stopServerAsync(app);
        // await connection.close();
        // await container.stop();
    });

    beforeEach(async () => {
        // await clearDatabaseAsync(connection);
    });

    it('should add a new group', async () => {
        const response = await supertest.agent(app)
            .post("/api/groups/")
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(201);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ message: `Added 1 group to database`})
    });

    it('should fetch a group', async () => {
        const response = await supertest.agent(app)
            .get("/api/groups/xxx")
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({})
    });

    it('should fetch all groups', async () => {
        const response = await supertest.agent(app)
            .get("/api/groups/all")
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual([])
    });

    it('should delete a group', async () => {
        const response = await supertest.agent(app)
            .delete("/api/groups/xxx")
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(204);
    });
});