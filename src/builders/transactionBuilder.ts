import { parse as htmlParse, Node } from 'node-html-parser';
import { parse as dateParse } from 'date-format-parse';
import { gmail_v1 } from "googleapis";
import GmailClient from "../clients/gmailClient";
import Transaction from "../models/transaction";
import PaymentDetails from "../models/paymentDetails";
import base64UrlDecode from "../utils/base64UrlDecode";
import EntryType from '../enums/entryType';
import XRegExp from 'xregexp';
import PaymentDetailsFactory from '../models/paymentDetailsFactory';
import CardOperationFactory from '../factories/cardOperationFactory';
import UnsupportedTxnError from '../errors/unsupportedTxnError';
import PaymentDetailsProcessingError from '../errors/paymentDetailsProcessingError';
import FailedToProcessTxnError from '../errors/failedToProcessTxnError';
import StandardTransferFactory from '../factories/standardTransferFactory';
import StandardFeeFactory from '../factories/standardFeeFactory';
import CrossBorderTransferFactory from '../factories/crossBorderTransferFactory';

export default class TransactionBuilder {
    private gmailClient: GmailClient;

    private static readonly emptyPaymentDetails: PaymentDetails = {
        beneficiary: ''
    }

    constructor(gmailClient: GmailClient) {
        this.gmailClient = gmailClient;
    }

    public async buildAsync(messageItem: gmail_v1.Schema$Message) {
        const message = await this.constructMessageAsync(messageItem);

        try {
            const attachment = await this.constructAttachmentAsync(message);

            const decodedAttachment = this.decodeAttachment(attachment);

            const transaction = this.constructTransaction(message, decodedAttachment);

            return transaction;
        } catch (ex) {
            if (ex instanceof Error) {
                throw new FailedToProcessTxnError(`Failed to process transaction from message with ID ${message.id}: ${ex.stack}`);
            }
            
            throw new FailedToProcessTxnError(`Failed to process transaction from message with ID ${message.id}: ${ex}`);
        }
    }

    private async constructMessageAsync(messageItem: gmail_v1.Schema$Message) {
        console.log(`Requesting message ID ${messageItem.id}...`);

        const message = await this.gmailClient.getMessageAsync(messageItem);

        console.log(`Received message with ID ${message.id}`);

        return message;
    }

    private async constructAttachmentAsync(message: gmail_v1.Schema$Message) {
        console.log(`Requesting attachment from message with ID ${message.id}...`);

        const attachment = await this.gmailClient.getAttachmentAsync(message);

        if (attachment === null || attachment === undefined) {
            throw new Error(`Missing attachment`);
        }

        console.log(`Received attachment from message with ID ${message.id}`);

        return attachment;
    }

    private decodeAttachment(attachment: string) {
        const urlDecoded = base64UrlDecode(attachment);
    
        const base64Decoded = Buffer.from(urlDecoded, 'base64');
    
        const utf16Decoded = base64Decoded.toString('utf16le');
    
        return utf16Decoded;
    }

    private constructTransaction(message: gmail_v1.Schema$Message, attachmentData: string): Transaction<PaymentDetails> {
        console.log(`Processing transaction from message with ID ${message.id}`);

        if (message.id === null || message.id === undefined) {
            throw new Error(`Missing message ID`);
        }

        const txnData = htmlParse(attachmentData).
            childNodes[1].       // <html>
            childNodes[3].       // <body>
            childNodes[12].      // <table>
            childNodes[5].       // <tr>
            childNodes;          // <td>[]

        const date = dateParse(txnData[1]
            .childNodes[0]
            .rawText, 'DD.MM.YYYY HH:mm:ss').getTime();

        const reference = txnData[3]
            .childNodes[1]
            .childNodes[0]
            .rawText;

        const valueDate = dateParse(txnData[5]
            .childNodes[0]
            .rawText, 'DD.MM.YYYY').getTime();

        const sum = Number(txnData[7]
            .childNodes[0]
            .rawText);

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

        const transactionType = txnData[11]
            .childNodes
            .map(n => 
                XRegExp('(?:[^\\/])*[\\/]*((?=\\p{Lu})\\p{Cyrillic}+.*)')
                    .exec(n.rawText)
                   ?.filter(r => r !== null && r !== undefined)
                   ?.[1])
           ?.filter(n => n !== undefined && n !== '')
           ?.[0];

        const transactionTypeValid = transactionType !== undefined;

        const transactionDetails = txnData.slice(11);

        try {
            const paymentDetails = this.tryConstructPaymentDetails(transactionType, transactionDetails);
            
            const paymentDetailsValid = paymentDetails !== null;

            const finalPaymentDetails = transactionTypeValid && paymentDetailsValid
                ? paymentDetails
                : TransactionBuilder.emptyPaymentDetails;

            const transaction: Transaction<PaymentDetails> = {
                messageId: message.id,
                date: date,
                reference: reference,
                valueDate: valueDate,
                sum: sum,
                entryType: entryType,
                paymentDetails: finalPaymentDetails
            }
            
            console.log(`Successfully processed transaction with reference ${transaction.reference}`);

            return transaction;
        } catch(ex) {
            if(ex instanceof Error) {
                throw new Error(`Transaction reference ${reference}: ${ex.message}`);
            }

            throw new Error(`Transaction reference ${reference}: '${ex}'`);
        }
    }

    private tryConstructPaymentDetails(transactionType: string | undefined, transactionDetails: Node[]) {
        if (transactionType === undefined) {
            return null;
        }

        try {
            const paymentDetailsFactory = this.getPaymentDetailsFactory(transactionType);
            const paymentDetails = paymentDetailsFactory.create(transactionDetails);

            return paymentDetails;
        } catch(ex) {
            if (ex instanceof UnsupportedTxnError ||
                ex instanceof PaymentDetailsProcessingError) {
                console.log(`Failed to construct payment details. Reason: ${ex.message}. Falling back to using empty payment details body...`);

                return null;
            }

            throw ex;
        }
    }

    private getPaymentDetailsFactory(transactionType: string): PaymentDetailsFactory<PaymentDetails> {
        switch(transactionType) {
            case 'Операция с карта':
                return new CardOperationFactory();

            case 'Издаване на превод във валута':
                return new CrossBorderTransferFactory();

            case 'Периодична такса':
            case 'Такса за междубанков превод':
            case 'Такса за превод':
            case 'Такси издадени валутни преводи':
            case 'Такса за вътрешнобанков превод':
            case 'Такса за теглене над определена сума':
            case 'Теглене на пари на каса от клнт с-к':
                return new StandardFeeFactory(transactionType);
            
            case 'Вътрешно банков превод Payroll': 
            case 'Плащане на лихва':
            case 'Удържане на данък в/у лихва':
            case 'Вътрешнобанков превод FC':
            case 'Вътрешнобанков превод':
            case 'Платежно нареждане извън банката':
            case 'Комунално плащане mBanking':
            case 'Комунално плaщане':
            case 'Получен междубанков превод':
            case 'Комунално плащане BBO':
            case 'Получен вътр.банков превод':
            case 'Периодично плащане':
            case 'Погасяване на главница':
            case 'Застрахователна премия':
            case 'Погасяв.на л-ва за редовна главница':
            case 'Издаден вътр.банков превод':
                return new StandardTransferFactory(transactionType);

            default:
                throw new UnsupportedTxnError(transactionType);

        }
    }
}