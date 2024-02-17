import { describe, it, beforeEach, beforeAll, afterAll, expect } from '@jest/globals';
import * as supertest from 'supertest';
import { defineDatabaseModels, registerDependencies, startServerAsync, stopServerAsync } from '../../bootstrap';
import { createContainerDatabaseConnectionAsync, createMariaDbContainerAsync } from '../../core/utils/databaseContainerUtils';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import { StartedTestContainer, Wait } from 'testcontainers';
import { Server } from 'http';
import { Sequelize } from 'sequelize-typescript';
import Constants from '../../constants';

describe('Groups Routes Tests', () => {
    let container: StartedTestContainer;
    let connection: Sequelize;
    let app: Server;

    beforeAll(async () => {
        registerDependencies();

        // container = await createMariaDbContainerAsync();
        // connection = await createContainerDatabaseConnectionAsync(container);
        // await defineDatabaseModels(connection);
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

    it('should add a new group rule', async () => {
        const response = await supertest.agent(app)
            .post("/api/groups/xxx/rules")
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(201);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({ message: `Added 1 rule to database`})
    });

    it('should fetch a group rule', async () => {
        const response = await supertest.agent(app)
            .get("/api/groups/xxx/rules/1")
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual({})
    });

    it('should fetch all group rules', async () => {
        const response = await supertest.agent(app)
            .get("/api/groups/xxx/rules/all")
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(200);
        expect(response.headers["content-type"]).toMatch(/json/);
        expect(response.body).toEqual([])
    });

    it('should delete a group rule', async () => {
        const response = await supertest.agent(app)
            .delete("/api/groups/xxx/rules/1")
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(204);
    });
});