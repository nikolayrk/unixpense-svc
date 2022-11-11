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
import InternalTransferPayrollFactory from '../factories/internalTransferPayrollFactory';

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
            // 'Периодична такса': ...,
            // 'Комунално плaщане': ...,
            // 'Комунално плащане mBanking': ...,
            // 'Комунално плащане BBO': ...,
            // 'Такса за превод': ...,
            // 'Периодично плащане': ...,
            // 'Получен вътр.банков превод': ...,
            // 'Издаден вътр.банков превод': ...,
            // 'Вътрешнобанков превод': ...,
            // 'Вътрешнобанков превод FC': ...,
            'Вътрешно банков превод Payroll': new InternalTransferPayrollFactory(),
            // 'Такса за вътрешнобанков превод': ...,
            // "Погасяване на главница': ...,
            // "Погасяв.на л-ва за редовна главница': ...,
            // "Застрахователна премия': ...,
            // 'Плащане на лихва': ...,
            // 'Удържане на данък в/у лихва': ...,
            // 'Платежно нареждане извън банката': ...,
            // 'Получен междубанков превод': ...,
            // 'Такса за междубанков превод': ...,
            // 'Издаване на превод във валута': ...,
            // 'Такси издадени валутни преводи': ...,
            // 'Такса за теглене над определена сума': ...,
            // 'Теглене на пари на каса от клнт с-к': ...
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