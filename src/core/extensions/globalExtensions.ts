export {};

declare global {
    interface Date {
        toQuery(this: Date): string

        toResponse(this: Date): string

        fromLocaltoUTC(this: Date): Date
    }

    interface String {
        padTime(this: string): string

        padUTCTimezone(this: string): string
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

Date.prototype.fromLocaltoUTC = function (this: Date) {
    if (Number.isNaN(this.getTime())) {
        return this;
    }

    const tz = getBulgarianDSTOffset(this);
    const isoDateString = this
        .toISOString()
        .replace(/([+-]\d{2}:?\d{2}|Z)$/, tz);

    const utcDate = new Date(isoDateString);

    return utcDate;
}

function getBulgarianDSTOffset(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const marchMonthIndex = 2;
    const octoberMonthIndex = 9;

    const lastSundayOfMarch = getLastSundayOfMonth(year, marchMonthIndex);
    const lastSundayOfOctober = getLastSundayOfMonth(year, octoberMonthIndex);

    const isInDST = 
        (month > marchMonthIndex || (month === marchMonthIndex && day >= lastSundayOfMarch)) &&
        (month < octoberMonthIndex || (month === octoberMonthIndex && day < lastSundayOfOctober));
        
    return isInDST
        ? '+03:00' // Bulgarian DST offset
        : '+02:00'; // Standard offset
}

const getLastSundayOfMonth = (year: number, month: number) => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate(); // Get the last day of the month
    const lastSunday = lastDayOfMonth - new Date(year, month, lastDayOfMonth).getDay(); // Calculate the date of the last Sunday
    return lastSunday;
};

String.prototype.padTime = function (this: string) {
    return this.concat(' 00:00:00');
}

String.prototype.padUTCTimezone = function (this: string) {
    return this.concat('+00:00');
}
