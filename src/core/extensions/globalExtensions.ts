export {};

declare global {
    interface Date {
        toSqlDate(this: Date): string
    }

    interface String {
        toUTCDate(this: string): Date
    }
}

Date.prototype.toSqlDate = function (this: Date) {
    const sqlDate = this
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

    return sqlDate;
}

String.prototype.toUTCDate = function (this: string) {
    const isoDate = `${this}.000Z`.replace(' ', 'T');
    
    return new Date(isoDate)
}