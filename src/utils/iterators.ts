import { gmail_v1 } from "googleapis";
import GmailClient from "../clients/gmailClient";
import TransactionRepository from "../repositories/transactionRepository";

export function * messageItemIterator(messageIdQuery: string) {
    const messageIds = messageIdQuery.split(',');

    for (const mIdx in messageIds) {
        const messageId = messageIds[mIdx];
        const messageItem: gmail_v1.Schema$Message = {
            id: messageId,
        };

        yield messageItem;
    }
}

export async function* gmailMessageListItemIterator(gmailClient: GmailClient): AsyncGenerator<gmail_v1.Schema$Message, any, unknown> {
    for await (const messageListPage of gmailClient.getMessageListAsync()) {
        const messageList = constructMessageList(messageListPage);

        for (const messageIdx in messageList) {
            const messageItem = messageList[messageIdx];
            
            yield messageItem;
        }

        const nextPageToken = messageListPage.nextPageToken;

        if (nextPageToken !== undefined) {
            yield * gmailMessageListItemIterator(gmailClient);
        }
    }
}

function constructMessageList(messageListPage: gmail_v1.Schema$ListMessagesResponse) {
    const messageList = messageListPage.messages;
    const nextPageToken = messageListPage.nextPageToken;

    console.log(`Requesting message list${nextPageToken !== undefined ? ` with page token ${nextPageToken}` : ''}`);

    if (messageList === undefined) {
        throw new Error(`Failed to get message list`);
    }

    console.log(`Received page of ${messageList.length} messages`);

    return messageList;
}