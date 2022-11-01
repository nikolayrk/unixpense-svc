import { parse as htmlParse, Node } from 'node-html-parser';
import { parse as dateParse } from 'date-format-parse';
import { gmail_v1 } from "googleapis";
import GmailClient from "../clients/gmailClient";
import Transaction from "../models/transaction";
import TransactionType from "../models/transactionType";
import base64UrlDecode from "../utils/base64UrlDecode";
import EntryType from '../enums/entryType';
import XRegExp from 'xregexp';
import TransactionTypeFactory from '../models/transactionTypeFactory';

export default class TransactionBuilder {
    private gmailClient: GmailClient;
    private readonly transactionTypeFactories: Partial<Record<string, TransactionTypeFactory<TransactionType>>>;

    private static readonly emptyDescription: TransactionType = {
        beneficiary: ''
    }

    constructor(gmailClient: GmailClient) {
        this.gmailClient = gmailClient;
        this.transactionTypeFactories = {
            // 'Операция с карта': ...,
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
            // 'Вътрешно банков превод Payroll': ...,
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
        };
    }

    public async* buildAsync(messageItem: gmail_v1.Schema$Message) {
        const message = await this.constructMessageAsync(messageItem);

        try {
            const attachment = await this.constructAttachmentAsync(message);

            const decodedAttachment = this.decodeAttachment(attachment);

            const transaction = this.constructTransaction(message, decodedAttachment);

            yield transaction;
        } catch (ex) {
            if (ex instanceof Error) {
                console.log(`Failed to process transaction from message with ID ${message.id}: ${ex.stack}`);
            }
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
            throw new Error(`Transaction reference ${reference}: Unregonised transaction entry '${entryTypeStr}'`);
        }

        const transactionType = txnData[11]
            .childNodes
            .map(n => 
                XRegExp('(?:[^\\/])*((?=\\p{Lu})\\p{Cyrillic}*[\\W]+.*)')
                    .exec(n.rawText)?.[0])
            .filter(n => n !== '')?.[0];

        const transactionTypeValid = transactionType !== undefined;

        const transactionDetails = txnData.slice(11);

        const description = this.tryConstructTransactionDescription(transactionType, transactionDetails, reference);
        
        const descriptionValid = description !== null;

        const finalDescription = transactionTypeValid && descriptionValid
            ? description
            : TransactionBuilder.emptyDescription;

        const transaction: Transaction<TransactionType> = {
            messageId: message.id,
            date: date,
            reference: reference,
            valueDate: valueDate,
            sum: sum,
            entryType: entryType,
            description: finalDescription
        }
        
        console.log(`Successfully processed transaction with reference ${transaction.reference}`);

        return transaction;
    }

    private tryConstructTransactionDescription(transactionType: string | undefined, transactionDetails: Node[], reference: string) {
        if (transactionType === undefined) {
            return null;
        }

        const transactionTypeFactory = this.transactionTypeFactories[transactionType];
        const description = transactionTypeFactory?.tryCreate(transactionDetails);

        if (description === undefined) {
            throw new Error(`Transaction reference ${reference}: Unsupported transaction type '${transactionType}'`);
        }

        return description;
    }
}