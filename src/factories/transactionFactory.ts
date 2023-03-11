import { parse as htmlParse } from 'node-html-parser';
import { parse as dateParse } from 'date-format-parse';
import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";
import EntryType from '../enums/entryType';
import XRegExp from 'xregexp';
import { TRANSACTION_TYPES } from '../types/transactionTypeString';
import TransactionType from '../enums/transactionType';
import transactionTypesByString from '../indexSignatures/transactionTypeByString';
import PaymentDetailsBuilder from '../builders/paymentDetailsBuilder';

export default class TransactionFactory {
    private readonly paymentDetailsBuilder: PaymentDetailsBuilder;
    
    private static readonly emptyPaymentDetails: PaymentDetails = {
        beneficiary: ''
    }

    constructor(paymentDetailsBuilder: PaymentDetailsBuilder) {
        this.paymentDetailsBuilder = paymentDetailsBuilder;
    }

    public create(messageId: string, attachmentData: string): Transaction<PaymentDetails> {
        console.log(`Processing transaction from message with ID ${messageId}`);

        const txnData = htmlParse(attachmentData).
            childNodes[1].       // <html>
            childNodes[3].       // <body>
            childNodes[12].      // <table>
            childNodes[5].       // <tr>
            childNodes;          // <td>[]

        const date = dateParse(txnData[1]
            .childNodes[0]
            .rawText, 'DD.MM.YYYY HH:mm:ss');

        const reference = txnData[3]
            .childNodes[1]
            .childNodes[0]
            .rawText;

        const valueDate = dateParse(txnData[5]
            .childNodes[0]
            .rawText, 'DD.MM.YYYY');

        const sum = txnData[7]
            .childNodes[0]
            .rawText;

        const entryTypeStr = txnData[9]
            .childNodes[0]
            .rawText;

        const entryType: EntryType = (entryTypeStr == 'ДТ' || entryTypeStr == 'DR')
            ? EntryType.DEBIT
            : (entryTypeStr == 'КТ' || entryTypeStr == 'CR')
                ? EntryType.CREDIT
                : EntryType.INVALID;

        if (entryType === EntryType.INVALID) {
            throw new Error(`Transaction reference ${reference}: Unregonised entry type '${entryTypeStr}'`);
        }

        const regex = XRegExp('(?:[^\\/])*[\\/]*((?=\\p{Lu})\\p{Cyrillic}+.*)');

        const transactionTypeParsed = txnData[11]
            .childNodes
            .map(n => 
                regex.exec(n.rawText)
                    ?.filter(r => r !== null && r !== undefined)
                    ?.[1])
           ?.filter(n => n !== undefined && n !== '')
           ?.[0];

        const transactionTypeByString = transactionTypeParsed as keyof typeof transactionTypesByString;

        const transactionTypeValid = 
            transactionTypeParsed !== undefined &&
            TRANSACTION_TYPES.includes(transactionTypeByString);

        const transactionType = transactionTypeValid
            ? transactionTypesByString[transactionTypeByString]
            : TransactionType.UNKNOWN;

        const transactionDetails = txnData
            .slice(11)[0]
            .childNodes;

        try {
            const paymentDetails = this.paymentDetailsBuilder.tryBuild(transactionType, transactionDetails);
            
            const paymentDetailsValid = paymentDetails !== null;

            const finalPaymentDetails = transactionTypeValid && paymentDetailsValid
                ? paymentDetails
                : TransactionFactory.emptyPaymentDetails;

            const transaction: Transaction<PaymentDetails> = {
                messageId: messageId,
                date: date,
                reference: reference,
                valueDate: valueDate,
                sum: sum,
                entryType: entryType,
                type: transactionType,
                paymentDetails: finalPaymentDetails
            }
            
            console.log(`Successfully processed transaction with reference ${transaction.reference}`);

            return transaction;
        } catch(ex) {
            const body = ex instanceof Error
                ? ex.message
                : ex;

            throw new Error(`Transaction reference ${reference}: '${body}'`);
        }
    }
}