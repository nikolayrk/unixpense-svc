import axios, { AxiosInstance } from "axios";
import { Cookie } from "playwright";

export class ApiClient {
    private axiosInstance: AxiosInstance;
    private oauth2ProxyCookie?: Cookie;
    private bearerToken?: string;

    constructor(baseUrl: string) {
        this.axiosInstance = axios.create({ baseURL: baseUrl });
    }

    public withCookieAuth(cookie: Cookie) {
        this.oauth2ProxyCookie = cookie;

        return this;
    }

    public withBearerToken(token: string) {
        this.bearerToken = token;

        return this;
    }

    public get(url: string) {
        const result = this.axiosInstance.get(url, this.options());

        return result;
    }

    public post(url: string, data?: object) {
        const result = this.axiosInstance.post(url, data, this.options());

        return result;
    }

    public put(url: string, data?: object) {
        const result = this.axiosInstance.put(url, data, this.options());

        return result;
    }

    public patch(url: string, data?: object) {
        const result = this.axiosInstance.patch(url, data, this.options());

        return result;
    }

    public delete(url: string) {
        const result = this.axiosInstance.delete(url, this.options());

        return result;
    }

    private options = () => {
        const headers: Record<string, string> = {};
        
        if (this.oauth2ProxyCookie) {
            headers.Cookie = `${this.oauth2ProxyCookie.name}=${this.oauth2ProxyCookie.value}`;
        }
        
        if (this.bearerToken) {
            headers.Authorization = `Bearer ${this.bearerToken}`;
        }
        
        return { headers };
    };
}