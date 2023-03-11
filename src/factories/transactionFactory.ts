import { parse as htmlParse, Node } from 'node-html-parser';
import { parse as dateParse} from 'date-format-parse';
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

    constructor(paymentDetailsBuilder: PaymentDetailsBuilder) {
        this.paymentDetailsBuilder = paymentDetailsBuilder;
    }

    public tryCreate(messageId: string, attachmentData: string): Transaction<PaymentDetails> {
        console.log(`Processing transaction from message with ID ${messageId}`);
        
        const transactionData = this.getTransactionData(attachmentData);

        const date = this.getDate(transactionData);
        const reference = this.getReference(transactionData);
        const valueDate = this.getValueDate(transactionData);
        const sum = this.getSum(transactionData);

        try {
            const entryType = this.tryGetEntryType(transactionData);
            const transactionType = this.getTransactionType(transactionData);
            const paymentDetails = this.tryGetPaymentDetails(transactionData, transactionType);

            const transaction: Transaction<PaymentDetails> = {
                messageId: messageId,
                date: date,
                reference: reference,
                valueDate: valueDate,
                sum: sum,
                entryType: entryType,
                type: transactionType,
                paymentDetails: paymentDetails
            }
            
            console.log(`Successfully processed transaction with reference ${transaction.reference}`);

            return transaction;
        } catch(ex) {
            const body = ex instanceof Error
                ? ex.message
                : ex;

            throw new Error(`Transaction reference ${reference}: ${body}`);
        }
    }

    private getTransactionData(attachmentData: string) {
        const transactionData = htmlParse(attachmentData).
            childNodes[1].       // <html>
            childNodes[3].       // <body>
            childNodes[12].      // <table>
            childNodes[5].       // <tr>
            childNodes;          // <td>[]

        return transactionData;
    }

    private getDate(transactionData: Node[]) {
        const date = dateParse(transactionData[1]
            .childNodes[0]
            .rawText, 'DD.MM.YYYY HH:mm:ss');

        return date;
    }

    private getReference(transactionData: Node[]) {
        const reference = transactionData[3]
            .childNodes[1]
            .childNodes[0]
            .rawText;

        return reference;
    }

    private getValueDate(transactionData: Node[]) {
        const valueDate = dateParse(transactionData[5]
            .childNodes[0]
            .rawText, 'DD.MM.YYYY');

        return valueDate;
    }

    private getSum(transactionData: Node[]) {
        const sum = transactionData[7]
            .childNodes[0]
            .rawText;

        return sum;
    }

    private tryGetEntryType(transactionData: Node[]) {
        const entryTypeStr = transactionData[9]
            .childNodes[0]
            .rawText;

        const entryType: EntryType = (entryTypeStr == 'ДТ' || entryTypeStr == 'DR')
            ? EntryType.DEBIT
            : (entryTypeStr == 'КТ' || entryTypeStr == 'CR')
                ? EntryType.CREDIT
                : EntryType.INVALID;

        if (entryType === EntryType.INVALID) {
            throw new Error(`Unregonised entry type '${entryTypeStr}'`);
        }

        return entryType;
    }

    private getTransactionType(transactionData: Node[]) {
        const regex = XRegExp('(?:[^\\/])*[\\/]*((?=\\p{Lu})\\p{Cyrillic}+.*)');

        const transactionTypeParsed = transactionData[11]
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

        return transactionType;
    }

    private tryGetPaymentDetails(transactionData: Node[], transactionType: TransactionType) {
        const emptyPaymentDetails: PaymentDetails = {
            beneficiary: ''
        }

        const paymentDetailsRaw = transactionData
            .slice(11)[0]
            .childNodes;
        
        const paymentDetails = this.paymentDetailsBuilder.tryBuild(transactionType, paymentDetailsRaw);
        
        const paymentDetailsValid = paymentDetails !== null;

        const finalPaymentDetails = paymentDetailsValid
            ? paymentDetails
            : emptyPaymentDetails;

        return finalPaymentDetails;
    }
}