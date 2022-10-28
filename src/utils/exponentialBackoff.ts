const wait = (ms: number): Promise<NodeJS.Timeout> => new Promise((res) => setTimeout(res, ms));

/**
 * https://developers.google.com/gmail/api/guides/handle-errors#exponential-backoff
 */
 export default async function exponentialBackoff(depth: number, fn: (...p: any[]) => any, ...params: any[]): Promise<any> {
    try {
        return await fn(...params);
    } catch (e) {
        if (depth > 7) {
            throw e;
        }
        console.log(e);
        await wait(2 ** depth * 1000); // [1s ... 64s]

        return exponentialBackoff(depth + 1, fn, ...params);
    }
}