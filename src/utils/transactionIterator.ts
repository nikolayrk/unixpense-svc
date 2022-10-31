import { gmail_v1 } from "googleapis";
import TransactionBuilder from "../builders/transactionBuilder";
import GmailClient from "../clients/gmailClient";

async function constructMessageList(messageListPage: gmail_v1.Schema$ListMessagesResponse) {
    const messageList = messageListPage.messages;
    const nextPageToken = messageListPage.nextPageToken;

    console.log(`Requesting message list${nextPageToken !== undefined ? ` with page token ${nextPageToken}` : ''}`);

    if (messageList === undefined) {
        throw new Error(`Failed to get message list`);
    }

    console.log(`Received page of ${messageList.length} messages`);

    return messageList;
}

export default async function* transactionIterator(gmailClient: GmailClient, transactionBuilder: TransactionBuilder) {
    for await (const messageListPage of gmailClient.getMessageListAsync()) {
        const messageList = await constructMessageList(messageListPage);

        for (const messageIdx in messageList) {
            const messageItem = messageList[messageIdx];

            yield* transactionBuilder.buildAsync(messageItem);
        }
    }
}
;
