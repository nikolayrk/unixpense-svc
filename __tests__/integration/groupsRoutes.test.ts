import { describe, it, expect } from '@jest/globals';
import integrationTestBase from './integration.test.base';
import axios, { AxiosInstance } from 'axios';
import Constants from '@shared/constants';

describe('Groups Routes Tests', () => {
    let apiClient: AxiosInstance;

    integrationTestBase({ beforeAllAppendix: () => {
        apiClient = axios.create({ baseURL: Constants.baseUrl });
    }});

    it('should add a new group', async () => {
        const response = await apiClient.post(`/api/groups`);

        expect(response).toMatchObject({
            status: 201,
            data: { message: `Added 1 group to database` },
        });
    });

    it('should fetch a group', async () => {
        const response = await apiClient.get(`/api/groups/1`);

        expect(response).toMatchObject({
            status: 200,
            data: {},
        });
    });

    it('should fetch all groups', async () => {
        const response = await apiClient.get(`/api/groups/all`);

        expect(response).toMatchObject({
            status: 200,
            data: [],
        });
    });

    it('should delete a group', async () => {
        const response = await apiClient.delete(`/api/groups/1`);

        expect(response.status).toEqual(204);
    });
});