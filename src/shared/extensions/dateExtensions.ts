export {};

declare global {
    interface Date {
        toSqlDate(this: Date): string
    }
}

Date.prototype.toSqlDate = function (this: Date) {
    const sqlDate = this
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

    return sqlDate;
}
