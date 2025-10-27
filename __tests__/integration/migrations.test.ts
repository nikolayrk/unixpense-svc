import { describe, it } from '@jest/globals';
import { resolveMigrationTool } from '@database/src/migrate';
import { Sequelize } from 'sequelize-typescript';
import { Umzug } from 'umzug';
import appTestBase from '../helpers/appTestBase';
import { EmptyMigrationTestCase, MigrationActionPair, MigrationTestCase } from '@database/src/types/migrations';
import { default as _01_full_text_indexers } from '@database/migrations/01_full_text_indexers.test';
import { default as _02_local_date_to_utc } from '@database/migrations/02_local_date_to_utc.test';
import { default as _03_03_add_tax_payment_type} from '@database/migrations/03_add_tax_payment_type.test';
import RepositoryError from '@shared/errors/repositoryError';

const Migrations = [
    '00_initial.up.sql',
    '01_full_text_indexers.up.sql',
    '02_local_date_to_utc.up.sql',
    '03_add_tax_payment_type.up.sql',
] as const;

type MigrationsUnion = typeof Migrations[number];

const migrationMap: {
    [key in MigrationsUnion]: MigrationTestCase
} = {
    ['00_initial.up.sql']: EmptyMigrationTestCase,
    ['01_full_text_indexers.up.sql']: _01_full_text_indexers,
    ['02_local_date_to_utc.up.sql']: _02_local_date_to_utc,
    ['03_add_tax_payment_type.up.sql']: _03_03_add_tax_payment_type,
};

describe('Database Migration Tests', () => {
    let connection: Sequelize | undefined;
    let migrationTool: Umzug<Sequelize> | undefined;

    appTestBase({ skipDefineDatabaseModels: true, beforeAllAppendix: async (sequelize: Sequelize) => {
        connection = sequelize;

        await connection.query(`DROP TABLE IF EXISTS ${[
            'card_operations',
            'standard_transfers',
            'transactions',
            'google_oauth2_tokens',
            'SequelizeMeta' // Umzug metadata
        ].join(', ')};`);

        migrationTool = resolveMigrationTool(connection);

        const migrations = await migrationTool.pending();
        const migrationNames = migrations.map(m => m.name);
        const migrationsWithTests = Object.keys(migrationMap);
        const allMigrationsHaveTests = migrationNames
            .every(m => migrationsWithTests
                .includes(m));

        if (!allMigrationsHaveTests) {
            const missing = migrationNames
                .filter(m => !migrationsWithTests
                    .includes(m));

            throw new Error(`Some migrations are missing tests: ${missing}`);
        }
    }});

    const defineMigrationTest = (migrationScriptName: string, [preAction, postAction]: MigrationActionPair, up: boolean) => {
        it(`should ${up ? 'apply' : 'revert'} '${migrationScriptName.replace('.up.sql', '')}' migration script`, async () => {
            if (!connection || !migrationTool) {
                throw new Error('Dependencies not resolved');
            }

            try {
                await preAction?.(connection);
    
                if (up) {
                    await migrationTool?.up({ migrations: [migrationScriptName] });
                } else {
                    await migrationTool?.down({ migrations: [migrationScriptName] });
                }
    
                await postAction?.(connection);
            } catch(ex) {
                throw new RepositoryError(ex as Error);
            }
        });
    }

    const defineMigrationUpTests = (migrationName: string) => Object
        .entries(migrationMap)
        .map(([k, [up, _]]) => k === migrationName ? defineMigrationTest(k, up, true) : null);
    
    const defineMigrationDownTests = (migrationName: string) => Object
        .entries(migrationMap)
        .map(([k, [_, down]]) => k === migrationName ? defineMigrationTest(k, down, false) : null);
    
    const migrationsWithTests = Object.keys(migrationMap);
    
    migrationsWithTests.map(defineMigrationUpTests);
    migrationsWithTests.slice().reverse().map(defineMigrationDownTests);
});