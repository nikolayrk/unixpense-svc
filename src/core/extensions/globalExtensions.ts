export {};

declare global {
    interface Date {
        toSqlDate(this: Date): string

        toQuery(this: Date): string

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
        .replace('T', ' ')
        .concat('.000000');

    return sqlDate;
}

Date.prototype.toQuery = function (this: Date) {
    const query = this
        .toISOString()
        .replace(/T.*/, '');

    return query;
}

Date.prototype.toResponse = function (this: Date) {
    const response = this.toLocaleDateString('en-GB', { timeZone: 'UTC' });

    return response;
}

String.prototype.toUTCDate = function (this: string) {
    const isoDate = this
        .replace(' ', 'T')
        .replace('.000000', '')
        .concat('.000Z');
    
    return new Date(isoDate)
}