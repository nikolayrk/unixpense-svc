import { Sequelize } from 'sequelize-typescript';
import { Umzug, SequelizeStorage, InputMigrations, Resolver, MigrationParams } from 'umzug';
import fs from 'fs';
import RepositoryError from './core/errors/repositoryError';

const resolveMigrationTool = (connection: Sequelize) => {
    const resolveMigrationFileContentsAsync = (path: string) => new Promise<string>(resolve =>
        fs.readFile(path, (err, data) => {
            if (err) throw err;
            if (data) resolve(data.toString());
        })
    );

    const executeQueryAsync = async (context: Sequelize, path: string) => {
        const sql = await resolveMigrationFileContentsAsync(path);

        try {
            const [results, ] = await context.query(sql);
            
            return results;
        } catch (ex) {
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
        glob: __dirname + '/**/migrations/*.{js,ts,up.sql}',
        resolve: resolver
    };

    const storage = new SequelizeStorage({ sequelize: connection });

    const umzug = new Umzug({
        migrations,
        storage,
        context: connection,
        logger: console,
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
    revertDatabaseMigrationsAsync,
}
