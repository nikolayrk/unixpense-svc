import { Sequelize } from "sequelize-typescript";

type MigrationAction = ((connection: Sequelize) => Promise<void>) | undefined;
type MigrationActionPair = [ MigrationAction, MigrationAction ];
type MigrationTestCase = [ MigrationActionPair, MigrationActionPair ];

const EmptyMigrationTestCase = [
    [undefined, undefined],
    [undefined, undefined]
] as MigrationTestCase;

export { MigrationActionPair, MigrationTestCase, EmptyMigrationTestCase }