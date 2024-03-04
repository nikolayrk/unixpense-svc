export {};

declare global {
    interface Date {
        toQuery(this: Date): string

        toResponse(this: Date): string
    }

    interface String {
        padTimezone(this: string): string
    }
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

String.prototype.padTimezone = function (this: string) {
    const tz = getTimezoneOffset();

    return this.concat(tz);
}

function getTimezoneOffset() {
    const offsetMinutes = new Date().getTimezoneOffset();

    if (offsetMinutes === 0) {
        return 'Z';
    }

    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    const offsetMinutesRemainder = Math.abs(offsetMinutes % 60);
    const sign = offsetMinutes < 0 ? '+' : '-';
    
    return `${sign}${padZero(offsetHours)}:${padZero(offsetMinutesRemainder)}`;
}

function padZero(number: number) {
    return String(number).padStart(2, '0');
}