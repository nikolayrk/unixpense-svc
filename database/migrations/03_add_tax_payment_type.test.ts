import { expect } from "@jest/globals";
import { Sequelize } from "sequelize-typescript";
import { MigrationTestCase } from "../src/types/migrations";

const action = (connection: Sequelize) => connection.query(`
    START TRANSACTION;

    INSERT INTO transactions (id, date, reference, value_date, sum, entry_type, type)
    VALUES ('transaction_id_5', '2023-07-31 12:00:00.000000', 'reference_value_5', '2023-07-30', 0.00, 'NONE', 'TAX_PAYMENT');

    INSERT INTO transactions (id, date, reference, value_date, sum, entry_type, type)
    VALUES ('transaction_id_6', '2023-07-31 12:00:00.000000', 'reference_value_6', '2023-07-30', 0.00, 'NONE', 'RECEIVED_CROSS_BORDER_TRANSFER');

    ROLLBACK;
`, { plain: true });

const expectFail = (connection: Sequelize) => expect(action(connection))
    .rejects
    .toThrow();

const expectSuccess = (connection: Sequelize) => expect(action(connection))
    .resolves
    .toStrictEqual({ affectedRows: 0, insertId: 0, warningStatus: 0 });

export default [
    [expectFail, expectSuccess],
    [undefined, expectFail]
] as MigrationTestCase