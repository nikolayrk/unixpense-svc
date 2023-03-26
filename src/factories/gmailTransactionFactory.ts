import { parse as htmlParse, Node } from 'node-html-parser';
import { parse as dateParse} from 'date-format-parse';
import PaymentDetails from "../models/paymentDetails";
import Transaction from "../models/transaction";
import EntryType from '../enums/entryType';
import XRegExp from 'xregexp';
import { TRANSACTION_TYPES } from '../types/transactionTypeString';
import TransactionType from '../enums/transactionType';
import transactionTypesByString from '../types/transactionTypeByString';
import PaymentDetailsBuilder from '../builders/paymentDetailsBuilder';
import { inject, injectable } from 'inversify';
import ITransactionFactory from '../contracts/ITransactionFactory';
import UnsupportedTxnError from '../errors/unsupportedTxnError';
import PaymentDetailsProcessingError from '../errors/paymentDetailsProcessingError';
import { injectables } from "../types/injectables";

@injectable()
export default class GmailTransactionFactory implements ITransactionFactory {
    private static readonly emptyPaymentDetails: PaymentDetails = {
        beneficiary: ''
    };

    private readonly paymentDetailsBuilder;

    public constructor(
        @inject(injectables.PaymentDetailsBuilder) paymentDetailsBuilder: PaymentDetailsBuilder
    ) {
        this.paymentDetailsBuilder = paymentDetailsBuilder;
    }

    public create(messageId: string, attachmentData: string): Transaction<PaymentDetails> {
        console.log(`Processing transaction from message with ID ${messageId}`);
        
        const transactionData = this.getTransactionData(attachmentData);

        const date = this.getDate(transactionData);
        const reference = this.getReference(transactionData);
        const valueDate = this.getValueDate(transactionData);
        const sum = this.getSum(transactionData);

        const entryType = this.getEntryType(transactionData);
        const transactionType = this.getTransactionType(transactionData);
        const paymentDetails = this.getPaymentDetails(reference, transactionData, transactionType);

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

        return transaction;
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

    private getEntryType(transactionData: Node[]) {
        const entryTypeStr = transactionData[9]
            .childNodes[0]
            .rawText;

        const entryType: EntryType = (entryTypeStr == 'ДТ' || entryTypeStr == 'DR')
            ? EntryType.DEBIT
            : (entryTypeStr == 'КТ' || entryTypeStr == 'CR')
                ? EntryType.CREDIT
                : EntryType.INVALID;

        if (entryType === EntryType.INVALID) {
            console.log(`Unregonised entry type '${entryTypeStr}'`);
        }

        return entryType;
    }

    private getTransactionType(transactionData: Node[]) {
        const regex = XRegExp('(?:[^\\/])*[\\/]*((?=\\p{Lu})\\p{Cyrillic}+.*)');

        const parsed = transactionData[11]
            .childNodes
            .map(n => 
                regex.exec(n.rawText)
                    ?.filter(r => r !== null && r !== undefined)
                    ?.[1])
           ?.filter(n => n !== undefined && n !== '')
           ?.[0];

        const typeByString = parsed as keyof typeof transactionTypesByString;

        const valid = 
            parsed !== undefined &&
            TRANSACTION_TYPES.includes(typeByString);

        const transactionType = valid
            ? transactionTypesByString[typeByString]
            : TransactionType.UNKNOWN;

        return transactionType;
    }

    private getPaymentDetails(reference: string, transactionData: Node[], type: TransactionType) {
        const detailsNodes = transactionData
            .slice(11)[0]
            .childNodes;

        const additionalDetailsNode = transactionData
            .slice(11)[2]
            .childNodes[1];
        
        try {
            const paymentDetails = this.paymentDetailsBuilder.tryBuild(reference, type, detailsNodes, additionalDetailsNode);
        
            return paymentDetails;
        } catch(ex) {
            if ((ex instanceof UnsupportedTxnError || ex instanceof PaymentDetailsProcessingError) === false) {
                throw new PaymentDetailsProcessingError(reference, ex as string);
            }

            const exception = ex as UnsupportedTxnError | PaymentDetailsProcessingError;

            console.log(exception.message);
            console.log('Falling back to using empty payment details body...');
        }

        return GmailTransactionFactory.emptyPaymentDetails;
    }
}