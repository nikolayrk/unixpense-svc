import { expect } from "@jest/globals";
import { Sequelize } from "sequelize-typescript";
import { MigrationTestCase } from "../src/types/migrations";

const upPreAction = async (connection: Sequelize) => {
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

const upPostAction = async (connection: Sequelize) => {
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

const downPostAction = async (connection: Sequelize) => {
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

export default [
    [upPreAction, upPostAction],
    [undefined, downPostAction]
] as MigrationTestCase