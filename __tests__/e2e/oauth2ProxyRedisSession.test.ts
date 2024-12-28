import Redis from 'ioredis';
import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { resolveOAuth2CookieAsync } from '../helpers/resolveOAuth2Cookie';
import Constants from '@shared/constants';

describe('OAuth2 Proxy Redis Session Tests', () => {
    let redis: Redis;

    beforeAll(async () => {
        redis = new Redis({
            host: process.env.REDIS_HOST,
            port: 6379,
        });

        await new Promise((resolve) => redis.once('ready', resolve));
    });

    afterAll(async () => {
        if (redis) {
            await redis.quit();
        }
    });

    it('should create Redis session', async () => {
        const oauth2Cookie = await resolveOAuth2CookieAsync();

        const keys = await redis.keys(`${Constants.cookieName}-*`);
        expect(keys.length).toBeGreaterThan(0);
    });
});