import "reflect-metadata";
import { createDatabaseConnectionAsync } from "@shared/database";
import { applyDatabaseMigrationsAsync, resolveMigrationTool } from "./migrate";

const main = async () => {
    const connection = await createDatabaseConnectionAsync();

    // @ts-ignore: error TS2345
    const migrationTool = resolveMigrationTool(connection);
    
    await applyDatabaseMigrationsAsync(migrationTool);
}

main();