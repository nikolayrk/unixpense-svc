import { Sequelize } from "sequelize-typescript";
import { InputMigrations, MigrationParams, Resolver, SequelizeStorage, Umzug } from "umzug";
import RepositoryError from "@shared/errors/repositoryError";
import fs from 'fs';
import path from "path";

const resolveMigrationTool = (connection: Sequelize) => {
    const resolveMigrationFileContentsAsync = (path: string) => new Promise<string>(resolve =>
        fs.readFile(path, (err, data) => {
            if (err) throw err;
            if (data) resolve(data.toString());
        })
    );

    const executeQueryAsync = async (context: Sequelize, path: string) => {
        const sql = await resolveMigrationFileContentsAsync(path);

        const transaction = await context.transaction();

        try {
            const [results, ] = await context.query(sql, { transaction });
            
            await transaction.commit();
            
            return results;
        } catch (ex) {
            await transaction.rollback();

            if (ex instanceof Error) {
                throw new RepositoryError(ex);
            }
        }
    }
    
    const resolver: Resolver<Sequelize> = (params: MigrationParams<Sequelize>) => {
        if (!params.path?.endsWith('.sql')) {
            return Umzug.defaultResolver(params);
        }

        return {
            name: params.name,
            up: async () => executeQueryAsync(params.context, params.path!),
            // eslint-disable-next-line
            down: async () => executeQueryAsync(params.context, params.path?.replace('.up.sql', '.down.sql')!)
        };
    };
    
    const migrations: InputMigrations<Sequelize> = {
        glob: `{${
            path.join(__dirname, '../migrations/*.up.sql')},${      // entry from migration tests
            path.join(__dirname, '../../../migrations/*.up.sql')    // entry from migration service
        }}`,
        resolve: resolver
    };

    const storage = new SequelizeStorage({ sequelize: connection });

    const umzug = new Umzug({
        migrations,
        storage,
        context: connection,
        logger: console, // TODO: ILogger
    });

    return umzug;
}

const applyDatabaseMigrationsAsync = async (umzug: Umzug<Sequelize>, step?: number) => {
    if (step === undefined) {
        await umzug.up();
    } else {
        await umzug.up({ step });
    }
}

const revertDatabaseMigrationsAsync = async (umzug: Umzug<Sequelize>, step?: number) => {
    if (step === undefined) {
        await umzug.down();
    } else {
        await umzug.down({ step });
    }
}

export {
    resolveMigrationTool,
    applyDatabaseMigrationsAsync,
    revertDatabaseMigrationsAsync
}