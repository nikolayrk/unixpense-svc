import { parse as htmlParse } from 'node-html-parser';
import { parse as dateParse } from 'date-format-parse';
import { gmail_v1 } from "googleapis";
import GmailClient from "../clients/gmailClient";
import Transaction from "../models/transaction";
import PaymentDetails from "../models/paymentDetails";
import base64UrlDecode from "../utils/base64UrlDecode";
import EntryType from '../enums/entryType';
import XRegExp from 'xregexp';
import FailedToProcessTxnError from '../errors/failedToProcessTxnError';
import transactionTypesByString from '../indexSignatures/transactionTypeByString';
import TransactionType from '../enums/transactionType';
import PaymentDetailsBuilder from './paymentDetailsBuilder';
import { TRANSACTION_TYPES } from '../types/transactionTypeString';

export default class TransactionBuilder {
    private readonly gmailClient: GmailClient;
    private readonly paymentDetailsBuilder: PaymentDetailsBuilder;

    private static readonly emptyPaymentDetails: PaymentDetails = {
        beneficiary: ''
    }

    constructor(gmailClient: GmailClient, paymentDetailsBuilder: PaymentDetailsBuilder) {
        this.gmailClient = gmailClient;
        this.paymentDetailsBuilder = paymentDetailsBuilder;
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
                : TransactionBuilder.emptyPaymentDetails;

            const transaction: Transaction<PaymentDetails> = {
                messageId: message.id,
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
            if(ex instanceof Error) {
                throw new Error(`Transaction reference ${reference}: ${ex.message}`);
            }

            throw new Error(`Transaction reference ${reference}: '${ex}'`);
        }
    }
}