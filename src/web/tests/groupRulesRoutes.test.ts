import { describe, it, beforeEach, beforeAll, afterAll, expect } from '@jest/globals';
import * as supertest from 'supertest';
import { createDatabaseConnectionAsync, registerDependencies, startServerAsync } from '../../bootstrap';
import ILogger from '../../core/contracts/ILogger';
import { DependencyInjector } from '../../dependencyInjector';
import { injectables } from '../../core/types/injectables';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import * as mariadb from 'mariadb';

describe('Group Rules Routes Tests', () => {
    const mariadbPort = 3306;
    const mariadbUser = 'root';
    const mariadbPassword = 'password';
    const mariadbDatabase = 'unixpense;'
    const beforeAllTimeout = 30 * 1000; // 30s

    let mariadbHost: string;
    let mariadbMappedPort: number;

    let logger: ILogger;

    let container: StartedTestContainer | null = null;
    let connection: Sequelize | null = null;
    let app: Server | null = null;

    beforeAll(async () => {
        registerDependencies();

        // logger = DependencyInjector.Singleton.resolve<ILogger>(injectables.ILogger);

        // container = await new GenericContainer("mariadb")
        //     .withEnvironment({ "MARIADB_ROOT_PASSWORD": mariadbPassword })
        //     .withExposedPorts(mariadbPort)
        //     .withWaitStrategy(Wait.forLogMessage("mariadbd: ready for connections.", 1))
        //     .start();

        // mariadbHost = container.getHost();
        // mariadbMappedPort = container.getMappedPort(mariadbPort);
        
        // connection = await createDatabaseConnectionAsync(
        //     mariadbHost,
        //     mariadbMappedPort,
        //     mariadbUser,
        //     mariadbPassword,
        //     mariadbDatabase,
        //     logger);

        const port = Math.round(Math.random() * (65535 - 1024) + 1024);

        app = await startServerAsync(port);
    }, beforeAllTimeout);
    
    afterAll(async () => {
        app?.close();

        // await connection?.close();
        
        // await container?.stop();
    });

    beforeEach(async () => {
        // await clearDatabaseAsync();
    });

    const clearDatabaseAsync = async () => {
        const pool = mariadb.createPool({
            host: mariadbHost,
            port: mariadbMappedPort,
            user: mariadbUser,
            password: mariadbPassword,
            database: mariadbDatabase,
            multipleStatements: true
        });
    
        const conn = await pool.getConnection();
    
        await conn.query([
                'card_operations',
                'standard_transfers',
                'transactions'
           ].map(table => `DELETE FROM ${table};`)
            .join(''));
    
        await conn.release();
    
        await pool.end();
    }

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
        expect(response.body).toEqual({})
    });

    it('should delete a group rule', async () => {
        const response = await supertest.agent(app)
            .delete("/api/groups/xxx/rules/1")
            .set('Accept', 'application/json')
            .send();

        expect(response.statusCode).toBe(204);
    });
});