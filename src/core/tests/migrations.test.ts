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
    '01_full-text-indexers.up.sql',
    '02_local_date_to_utc.up.sql'
] as const;

type MigrationsUnion = typeof Migrations[number];

type MigrationAction = (() => Promise<void>) | undefined;
type MigrationActionPair = [MigrationAction, MigrationAction];

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

    const defineMigrationTests_01_up_postAction = async () => {
        await connection.query(`
            INSERT INTO transactions (id, date, reference, value_date, sum, entry_type, type)
            VALUES ('transaction_id_0', '2024-02-17', 'reference_value_0', '2024-02-17', 0.00, 'NONE', 'UNKNOWN');

            INSERT INTO card_operations (transaction_id, recipient, instrument)
            VALUES ('transaction_id_0', 'Lorem ipsum dolor sit amet', 'Consectetur adipiscing elit');

            INSERT INTO transactions (id, date, reference, value_date, sum, entry_type, type)
            VALUES ('transaction_id_1', '2024-02-17', 'reference_value_1', '2024-02-17', 0.00, 'NONE', 'UNKNOWN');
            
            INSERT INTO standard_transfers (transaction_id, recipient, description)
            VALUES ('transaction_id_1', 'Sed do eiusmod tempor incididunt', 'Vitae aliquam justo tincidunt');
        `);
        
        const cardOperationRecipientResult = await connection.query(`
            SELECT * FROM card_operations WHERE MATCH(recipient) AGAINST('ipsum');
        `, { plain: true });
        
        const cardOperationInstrumentResult = await connection.query(`
            SELECT * FROM card_operations WHERE MATCH(instrument) AGAINST('adipiscing');
        `, { plain: true });
        
        const standardTransferRecipientResult = await connection.query(`
            SELECT * FROM standard_transfers WHERE MATCH(recipient) AGAINST('tempor');
        `, { plain: true });
        
        const standardTransferDescriptionResult = await connection.query(`
            SELECT * FROM standard_transfers WHERE MATCH(description) AGAINST('justo');
        `, { plain: true });
        
        expect(cardOperationRecipientResult?.recipient).toContain('ipsum');
        expect(cardOperationInstrumentResult?.instrument).toContain('adipiscing');
        expect(standardTransferRecipientResult?.recipient).toContain('tempor');
        expect(standardTransferDescriptionResult?.description).toContain('justo');
    }

    const defineMigrationTests_01_down_postAction = async () => {
        await expect(async () => connection.query(`
            SELECT * FROM card_operations WHERE MATCH(recipient) AGAINST('ipsum');
        `, { plain: true })).rejects.toThrowError(DatabaseError);
        
        await expect(async () => connection.query(`
            SELECT * FROM card_operations WHERE MATCH(instrument) AGAINST('adipiscing');
        `, { plain: true })).rejects.toThrowError(DatabaseError);
        
        await expect(async () => connection.query(`
            SELECT * FROM standard_transfers WHERE MATCH(recipient) AGAINST('tempor');
        `, { plain: true })).rejects.toThrowError(DatabaseError);
        
        await expect(async () => connection.query(`
            SELECT * FROM standard_transfers WHERE MATCH(description) AGAINST('justo');
        `, { plain: true })).rejects.toThrowError(DatabaseError);
    }

    const defineMigrationTests_02_up_preAction = async () => {
        await connection.query(`
            INSERT INTO transactions (id, date, reference, value_date, sum, entry_type, type)
            VALUES ('transaction_id_2', '2023-03-25 12:00:00.000000', 'reference_value_2', '2023-03-25', 0.00, 'NONE', 'UNKNOWN');

            INSERT INTO card_operations (transaction_id, recipient, instrument)
            VALUES ('transaction_id_2', '', '');

            INSERT INTO transactions (id, date, reference, value_date, sum, entry_type, type)
            VALUES ('transaction_id_3', '2023-05-20 13:00:00.000000', 'reference_value_3', '2023-05-20', 0.00, 'NONE', 'UNKNOWN');
            
            INSERT INTO standard_transfers (transaction_id, recipient, description)
            VALUES ('transaction_id_3', '', '');

            INSERT INTO transactions (id, date, reference, value_date, sum, entry_type, type)
            VALUES ('transaction_id_4', '2023-10-29 12:00:00.000000', 'reference_value_4', '2023-10-29', 0.00, 'NONE', 'UNKNOWN');
            
            INSERT INTO standard_transfers (transaction_id, recipient, description)
            VALUES ('transaction_id_4', '', '');
        `);
    }

    const defineMigrationTests_02_up_postAction = async () => {
        const preDstResult = await connection.query(`
            SELECT date FROM transactions WHERE id = 'transaction_id_2';
        `, { plain: true });
        
        const dstResult = await connection.query(`
            SELECT date FROM transactions WHERE id = 'transaction_id_3';
        `, { plain: true });
        
        const postDstResult = await connection.query(`
            SELECT date FROM transactions WHERE id = 'transaction_id_4';
        `, { plain: true });
        
        expect(preDstResult?.date).toEqual(new Date('2023-03-25 10:00:00 UTC')); // Sat before last Sun of Mar 23
        expect(dstResult?.date).toEqual(new Date('2023-05-20 10:00:00 UTC'));
        expect(postDstResult?.date).toEqual(new Date('2023-10-29 10:00:00 UTC')); // Last Sun of Oct 23
    }

    const defineMigrationTests_02_down_postAction = async () => {
        const preDstResult = await connection.query(`
            SELECT date FROM transactions WHERE id = 'transaction_id_2';
        `, { plain: true });
        
        const dstResult = await connection.query(`
            SELECT date FROM transactions WHERE id = 'transaction_id_3';
        `, { plain: true });
        
        const postDstResult = await connection.query(`
            SELECT date FROM transactions WHERE id = 'transaction_id_4';
        `, { plain: true });
        
        expect(preDstResult?.date).toEqual(new Date('2023-03-25 12:00:00 UTC'));
        expect(dstResult?.date).toEqual(new Date('2023-05-20 13:00:00 UTC'));
        expect(postDstResult?.date).toEqual(new Date('2023-10-29 12:00:00 UTC'));
    }

    const migrationMap: {
        [key in MigrationsUnion]: [ MigrationActionPair, MigrationActionPair ]
    } = {
        ['00_initial.up.sql']: [
            [undefined, undefined],
            [undefined, undefined]
        ],
        ['01_full-text-indexers.up.sql']: [
            [undefined, defineMigrationTests_01_up_postAction],
            [undefined, defineMigrationTests_01_down_postAction]
        ],
        ['02_local_date_to_utc.up.sql']: [
            [defineMigrationTests_02_up_preAction, defineMigrationTests_02_up_postAction],
            [undefined, defineMigrationTests_02_down_postAction]
        ],
    };

    const migrationsWithTests = Object.keys(migrationMap);

    const defineMigrationUpTest = (migrationScriptName: string, actions: MigrationActionPair) => {
        const [preAction, postAction] = [ ...actions ];

        it(`should apply '${migrationScriptName.replace('.up.sql', '')}' migration script`, async () => {
            try {
                await preAction?.();

                await migrationTool.up({ migrations: [migrationScriptName] });
    
                await postAction?.();
            } catch(ex) {
                throw new RepositoryError(ex);
            }
        });
    }

    const defineMigrationUpTests = (migrationName: string) =>
        Object
            .entries(migrationMap)
            .map(([k, [up, _]]) => k === migrationName ? defineMigrationUpTest(k, up) : null);

    const defineMigrationDownTest = (migrationScriptName: string, actions: MigrationActionPair) => {
        const [preAction, postAction] = [ ...actions ];

        it(`should revert '${migrationScriptName.replace('.up.sql', '')}' migration script`, async () => {
            try {
                await preAction?.();

                await migrationTool.down({ migrations: [migrationScriptName] });
    
                await postAction?.();
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