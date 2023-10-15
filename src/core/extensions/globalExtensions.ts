export {};

declare global {
    interface Date {
        toSqlDate(this: Date): string

        toResponse(this: Date): string
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

Date.prototype.toResponse = function (this: Date) {
    const response = this.toLocaleDateString('en-GB', { timeZone: 'UTC' });

    return response;
}

String.prototype.toUTCDate = function (this: string) {
    const isoDate = `${this}.000Z`.replace(' ', 'T');
    
    return new Date(isoDate)
}