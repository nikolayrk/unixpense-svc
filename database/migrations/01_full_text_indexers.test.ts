import { expect } from "@jest/globals";
import { Sequelize } from "sequelize-typescript";
import { MigrationTestCase } from "../src/types/migrations";

const upPostAction = async (connection: Sequelize) => {
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

const downPostAction = async (connection: Sequelize) => {
    await expect(connection.query(`
        SELECT * FROM card_operations WHERE MATCH(recipient) AGAINST('ipsum');
    `, { plain: true })).rejects.toThrow();
    
    await expect(connection.query(`
        SELECT * FROM card_operations WHERE MATCH(instrument) AGAINST('adipiscing');
    `, { plain: true })).rejects.toThrow();
    
    await expect(connection.query(`
        SELECT * FROM standard_transfers WHERE MATCH(recipient) AGAINST('tempor');
    `, { plain: true })).rejects.toThrow();
    
    await expect(connection.query(`
        SELECT * FROM standard_transfers WHERE MATCH(description) AGAINST('justo');
    `, { plain: true })).rejects.toThrow();
}

export default [
    [undefined, upPostAction],
    [undefined, downPostAction]
] as MigrationTestCase