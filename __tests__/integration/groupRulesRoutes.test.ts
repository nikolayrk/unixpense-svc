import { describe, it, expect } from '@jest/globals';
import appTestBase from '../helpers/appTestBase';
import Constants from '@shared/constants';
import { ApiClient } from '../helpers/apiClient';

describe('Group Rules Routes Tests', () => {
    let apiClient = new ApiClient(Constants.baseUrl);

    appTestBase();

    it('should add a new group rule', async () => {
        const response = await apiClient.post(`/api/groups/xxx/rules`);

        expect(response).toMatchObject({
            status: 201,
            data: { message: `Added 1 rule to database` },
        });
    });

    it('should fetch a group rule', async () => {
        const response = await apiClient.get(`/api/groups/xxx/rules/1`);

        expect(response).toMatchObject({
            status: 200,
            data: {},
        });
    });

    it('should fetch all group rules', async () => {
        const response = await apiClient.get(`/api/groups/xxx/rules/all`);

        expect(response).toMatchObject({
            status: 200,
            data: [],
        });
    });

    it('should delete a group rule', async () => {
        const response = await apiClient.delete(`/api/groups/xxx/rules/1`);

        expect(response.status).toEqual(204);
    });
});