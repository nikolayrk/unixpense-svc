import { parse as htmlParse, Node } from 'node-html-parser';
import { parse as dateParse } from 'date-format-parse';
import { gmail_v1 } from "googleapis";
import GmailClient from "../clients/gmailClient";
import Transaction from "../models/transaction";
import TransactionType from "../models/transactionType";
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

export default class TransactionBuilder {
    private gmailClient: GmailClient;
    private readonly paymentDetailsFactories: Partial<Record<string, PaymentDetailsFactory<TransactionType>>>;

    private static readonly emptyPaymentDetails: TransactionType = {
        beneficiary: ''
    }

    constructor(gmailClient: GmailClient) {
        this.gmailClient = gmailClient;
        this.paymentDetailsFactories = {
            'Операция с карта': new CardOperationFactory(),
            'Вътрешно банков превод Payroll': new StandardTransferFactory('Вътрешно банков превод Payroll'),
            'Периодична такса': new StandardFeeFactory('Периодична такса'),
            'Плащане на лихва': new StandardTransferFactory('Плащане на лихва'),
            'Удържане на данък в/у лихва': new StandardTransferFactory('Удържане на данък в/у лихва'),
            'Вътрешнобанков превод FC': new StandardTransferFactory('Вътрешнобанков превод FC'),
            'Вътрешнобанков превод': new StandardTransferFactory('Вътрешнобанков превод'),
            'Платежно нареждане извън банката': new StandardTransferFactory('Платежно нареждане извън банката'),
            'Такса за междубанков превод': new StandardFeeFactory('Такса за междубанков превод'),
            'Комунално плащане mBanking': new StandardTransferFactory('Комунално плащане mBanking'),
            'Такса за превод': new StandardFeeFactory('Такса за превод'),
            'Комунално плaщане': new StandardTransferFactory('Комунално плaщане'),
            'Получен междубанков превод': new StandardTransferFactory('Получен междубанков превод'),
            'Комунално плащане BBO': new StandardTransferFactory('Комунално плащане BBO'),
            'Получен вътр.банков превод': new StandardTransferFactory('Получен вътр.банков превод'),
            'Периодично плащане': new StandardTransferFactory('Периодично плащане'),
            // 'Издаване на превод във валута': ...,
            // 'Такси издадени валутни преводи': ...,
            'Погасяване на главница': new StandardTransferFactory('Погасяване на главница'),
            'Застрахователна премия': new StandardTransferFactory('Застрахователна премия'),
            'Погасяв.на л-ва за редовна главница': new StandardTransferFactory('Погасяв.на л-ва за редовна главница'),
            'Издаден вътр.банков превод': new StandardTransferFactory('Издаден вътр.банков превод'),
            'Такса за вътрешнобанков превод': new StandardFeeFactory('Такса за вътрешнобанков превод'),
            'Такса за теглене над определена сума': new StandardFeeFactory('Такса за теглене над определена сума'),
            'Теглене на пари на каса от клнт с-к': new StandardFeeFactory('Теглене на пари на каса от клнт с-к')
        };
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

    private constructTransaction(message: gmail_v1.Schema$Message, attachmentData: string): Transaction<TransactionType> {
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

            const transaction: Transaction<TransactionType> = {
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
            if(ex instanceof UnsupportedTxnError) {
                throw new Error(`Transaction reference ${reference}: ${ex.message}`);
            }

            if(ex instanceof Error) {
                throw ex;
            }

            throw new Error(`Transaction reference ${reference}: '${ex}'`);
        }
    }

    private tryConstructPaymentDetails(transactionType: string | undefined, transactionDetails: Node[]) {
        if (transactionType === undefined) {
            return null;
        }

        try {
            const paymentDetailsFactory = this.paymentDetailsFactories[transactionType];
            const paymentDetails = paymentDetailsFactory?.create(transactionDetails);

            if (paymentDetails === undefined) {
                throw new UnsupportedTxnError(transactionType);
            }

            return paymentDetails;
        } catch(ex) {
            if (ex instanceof PaymentDetailsProcessingError) {
                console.log(`Failed to construct payment details. Reason: ${ex.message}. Falling back to using empty payment details body...`);

                return null;
            }

            throw ex;
        }
    }
}