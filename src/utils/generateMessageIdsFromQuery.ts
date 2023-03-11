export default function * generateMessageIdsFromQuery(messageIdsQuery: string) {
    const messageIds = messageIdsQuery.split(',');

    for (const idx in messageIds) {
        const messageId = messageIds[idx];

        yield messageId;
    }
}