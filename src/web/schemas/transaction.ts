import { Schema } from "swagger-jsdoc"
import { EntryTypeExtensions } from "../../core/extensions/entryTypeExtensions"
import { TransactionTypeExtensions } from "../../core/extensions/transactionTypeExtensions"

const createTransactionSchema = (type: Schema, paymentDetails: Schema): Schema => {
    return {
        type: "object",
        properties: {
            id: {
                type: "string",
                description: "Global unique transaction ID across all transaction source providers.",
                example: "1773e8e6b4cff981"
            },
            date: {
                type: "string",
                description: "The datetime when the transaction was processed by the bank.",
                example: "Fri May 19th 2023 12:24:24 PM"
            },
            reference: {
                type: "string",
                description: "The reference for this transaction. Unique when coupled with the transaction type.",
                example: "403BATM230900160"
            },
            value_date: {
                type: "string",
                description: "The date when the transaction took place.",
                example: "Wed May 17th 2023"
            },
            sum: {
                type: "number",
                description: "The amount that was credited / debited from the bank account.",
                example: "12.34"
            },
            entry_type: {
                type: "string",
                enum: EntryTypeExtensions.Keys(),
                description: "The entry type of the transaction.",
                example: "DEBIT"
            },
            type: type,
            paymentDetails: paymentDetails
        }
    };
};

const cardOperationTransaction = createTransactionSchema({
        type: "string",
        enum: TransactionTypeExtensions.Keys(),
        description: "The type of transaction based on its payment details.",
        example: "CARD_OPERATION"
    }, {
        type: "object",
        properties: {
            recipient: {
                type: "string",
                description: "The receiving party of the transaction.",
                example: "Netflix"
            },
            instrument: {
                type: "string",
                description: "The payment mechanism used to facilitate the transaction.",
                example: "ПОС"
            },
            sum: {
                type: "string",
                description: "The sum of the transaction in the original currency it was executed.",
                example: "19.99"
            },
            currency: {
                type: "string",
                description: "The currency in which the transaction was executed.",
                example: "EUR"
            },
        }
    });

const standardTransferTransaction = createTransactionSchema({
        type: "string",
        enum: TransactionTypeExtensions.Keys(),
        description: "The type of transaction based on its payment details.",
        example: "UTILITY_PAYMENT"
    }, {
        type: "object",
        properties: {
            recipient: {
                type: "string",
                description: "The receiving party of the transaction.",
                example: "ЧЕЗ ЕЛЕКТРО БЪЛГАРИЯ АД"
            },
            recipientIban: {
                type: "string",
                description: "The IBAN of the recipient of the transaction.",
                example: "BG81UNCR763044444CEZEL"
            },
            description: {
                type: "string",
                description: "Any additional description of the transaction.",
                example: "ЧЕЗ единични плащания 310123456795 271234596/09.04.2020/09.04.2020"
            }
        }
    });

export { cardOperationTransaction, standardTransferTransaction };