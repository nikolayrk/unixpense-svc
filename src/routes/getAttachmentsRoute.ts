import { Request, Response } from "express";
import { google } from 'googleapis';
import { OAuth2Client } from "google-auth-library";
import GmailClient from "../clients/gmailClient";
import base64UrlDecode from "../utils/base64UrlDecode";

export default class GetAttachmentsRoute {
    private oauth2Client: OAuth2Client;

    constructor(oauth2Client: OAuth2Client) {
        this.oauth2Client = oauth2Client;
    }

    public route = async (req: Request, res: Response) => {
        const gmailApi = google.gmail({version: 'v1', auth: this.oauth2Client});
        const gmail = new GmailClient(gmailApi);
    
        console.log(`Requesting message list`);
    
        const messageList = await gmail.getMessageListAsync();
    
        console.log(`Received ${messageList.length} messages`);
    
        const attachments = new Array<string>();
    
        for (const messageIdx in messageList) {
            const messageItem = messageList[messageIdx];
            
            console.log(`Requesting message #${messageIdx} with ID ${messageItem.id}...`);
    
            const message = await gmail.getMessageAsync(messageItem);
    
            if (message.id === null || message.id === undefined) {
                console.log(`Failed to get message #${messageIdx}`);
    
                continue;
            }
    
            console.log(`Received message with ID ${message.id}`);
    
            const attachmentId = message.payload?.parts?.[1].body?.attachmentId ?? undefined;
    
            if (attachmentId === undefined) {
                console.log(`No attachment ID found in message with ID ${message.id}`);
    
                continue;
            }
            
            console.log(`Requesting attachment from message with ID ${message.id}...`);
    
            const attachment = await gmail.getAttachmentAsync(attachmentId, message.id);
    
            if (attachment === null || attachment === undefined) {
                console.log(`Failed to get attachment from message with ID ${message.id}`);
    
                continue;
            }
    
            console.log(`Received attachment from message with ID ${message.id}`);
    
            const decodedAttachment = await this.decodeAttachment(attachment);
    
            attachments.push(decodedAttachment);
        }
    
        res.send(attachments);
    }

    private async decodeAttachment(attachment: string) {
        const urlDecoded = base64UrlDecode(attachment);
    
        const base64Decoded = Buffer.from(urlDecoded, 'base64');
    
        const utf16Decoded = base64Decoded.toString('utf16le');
    
        return utf16Decoded;
    }
}