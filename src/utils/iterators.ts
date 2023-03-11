import { gmail_v1 } from "googleapis";
import GmailClient from "../clients/gmailClient";

export function * messageIdsIterator(messageIdsQuery: string) {
    const messageIds = messageIdsQuery.split(',');

    for (const idx in messageIds) {
        const messageId = messageIds[idx];

        yield messageId;
    }
}

export async function * gmailMessageIdsIterator(gmailClient: GmailClient, nextPageToken?: string | null): AsyncGenerator<string, any, unknown> {
    for await (const messageListPage of gmailClient.getMessageListAsync(nextPageToken)) {
        const messageList = constructMessageList(messageListPage);

        for (const messageIdx in messageList) {
            const messageItem = messageList[messageIdx];

            if (messageItem.id === null || messageItem.id === undefined) {
                throw new Error('Empty message id');
            }
            
            yield messageItem.id;
        }

        const nextPageToken = messageListPage.nextPageToken;

        if (nextPageToken !== undefined) {
            yield * gmailMessageIdsIterator(gmailClient, nextPageToken);
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