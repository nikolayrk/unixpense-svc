import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { registerDependencies, resolveMigrationTool } from '../../bootstrap';
import { clearDatabaseAsync, createContainerDatabaseConnectionAsync, createMariaDbContainerAsync } from '../utils/databaseContainerUtils';
import { StartedTestContainer } from 'testcontainers';
import { Sequelize } from 'sequelize-typescript';
import Constants from '../../constants';
import { Umzug } from 'umzug';
import { afterEach } from 'node:test';
import { DatabaseError } from 'sequelize';
import RepositoryError from '../errors/repositoryError';

const Migrations = [
    '00_initial.up.sql',
] as const;

type MigrationsUnion = typeof Migrations[number];

describe('Database Migration Tests', () => {
    let container: StartedTestContainer;
    let connection: Sequelize;
    let migrationTool: Umzug<Sequelize>;

    beforeAll(async () => {
        registerDependencies();

        container = await createMariaDbContainerAsync();
        connection = await createContainerDatabaseConnectionAsync(container);

        migrationTool = resolveMigrationTool(connection);
        const migrations = await migrationTool.pending();
        const migrationNames = migrations.map(m => m.name);
        const allMigrationsHaveTests = migrationNames
            .every(m => migrationsWithTests
            .includes(m));

        if (!allMigrationsHaveTests) {
            const missing = migrationNames
                .filter(m => !migrationsWithTests
                .includes(m));

            throw new Error(`Some migrations are missing tests: ${missing}`);
        }
    }, Constants.Defaults.containerTimeout);
    
    afterAll(async () => {
        await connection.close();
        await container.stop();
    });

    afterEach(async () => {
        await clearDatabaseAsync(connection);        
    });

    const migrationMap: {
        [key in MigrationsUnion]: [(() => Promise<void>) | undefined, (() => Promise<void>) | undefined]
    } = {
        ['00_initial.up.sql']: [undefined, undefined],
    };

    const migrationsWithTests = Object.keys(migrationMap);

    const defineMigrationUpTest = (migrationScriptName: string, verify?: () => Promise<void>) => {
        it(`should apply '${migrationScriptName.replace('.up.sql', '')}' migration script`, async () => {
            try {
                await migrationTool.up({ migrations: [migrationScriptName] });
    
                await verify?.();
            } catch(ex) {
                throw new RepositoryError(ex);
            }
        });
    }

    const defineMigrationUpTests = (migrationName: string) =>
        Object
            .entries(migrationMap)
            .map(([k, [up, _]]) => k === migrationName ? defineMigrationUpTest(k, up) : null);

    const defineMigrationDownTest = (migrationScriptName: string, verify?: () => Promise<void>) => {
        it(`should revert '${migrationScriptName.replace('.up.sql', '')}' migration script`, async () => {
            try {
                await migrationTool.down({ migrations: [migrationScriptName] });
    
                await verify?.();
            } catch(ex) {
                throw new RepositoryError(ex);
            }
        });
    }

    const defineMigrationDownTests = (migrationName: string) => {
        Object
            .entries(migrationMap)
            .map(([k, [_, down]]) => k === migrationName ? defineMigrationDownTest(k, down) : null);
    }

    migrationsWithTests
        .map(defineMigrationUpTests);

    migrationsWithTests
        .slice()
        .reverse()
        .map(defineMigrationDownTests);
});