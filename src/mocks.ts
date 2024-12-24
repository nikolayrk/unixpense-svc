// @ts-nocheck
import nock from "nock";
import TransactionTestHelper from "./core/utils/transactionTestHelper";
import { gmailPaymentDetailsTestCases } from "./gmail/types/gmailPaymentDetailsTestCases";
import Constants from "@shared/constants";
import { URL, URLSearchParams } from "url";
import * as googleOAuth2Middleware from './web/middleware/googleOAuth2Middleware';
import * as transactionsController from "./web/controllers/transactionsController";
import * as gmailTransactionsController from "./web/controllers/gmailTransactionsController";
import * as groupsController from './web/controllers/groupsController';
import * as groupRulesController from './web/controllers/groupRulesController';
import { NextFunction, Request, Response } from "express";
import queryString from "node:querystring";

const gmailApiBaseUrl = 'https://gmail.googleapis.com';
const oauth2ApiBaseUrl = 'https://oauth2.googleapis.com';
const localApiBaseUrl = Constants.baseUrl;

const messageListUri = /\/gmail\/v1\/users\/[^\/%]+\/messages/;
const messageUri = /\/gmail\/v1\/users\/[^/]+\/messages\/([^/]+)$/;
const attachmentsUri = /\/gmail\/v1\/users\/[^/]+\/messages\/([^/]+)\/attachments\/[^/]+/;
const tokenUri = '/token';
const tokenInfoUri = '/tokeninfo';

const oauthCallbackUri = '/api/oauthcallback';
const transactionsUri = /\/api\/transactions(?!\/).*/;
const transactionsSaveUri = '/api/transactions/save';
const transactionsUpdateUri = '/api/transactions/update';
const transactionsLastIdsUri = /\/api\/transactions\/gmail\/ids\/last\/([^?]*)[?]*.*/;
const transactionsGmailResolveUri = '/api/transactions/gmail/resolve';
const groupsUri = '/api/groups';
const groupsAllUri = '/api/groups/all';
const groupUri = /^\/api\/groups\/(?!all)([^\/?]+)[?]?$/;
const groupRulesNewUri = /^\/api\/groups\/[^\/]+\/rules$/;
const groupRulesAllUri = /^\/api\/groups\/[^\/]+\/rules\/all$/;
const groupRuleUri = /^\/api\/groups\/[^\/]+\/rules\/(?!all)([^\/?]+)[?]?$/;

export const applyGoogleMocksAsync = async () => {
    const gmailScope = nock(gmailApiBaseUrl);
    const oauth2Scope = nock(oauth2ApiBaseUrl);
    
    gmailScope
        .get(messageUri)
        .reply(messageCallback)
        .persist();
    
    gmailScope
        .get(attachmentsUri)
        .reply(200, attachmentsCallback)
        .persist();
    
    gmailScope
        .get(messageListUri)
        .reply(200, messageListCallback)
        .persist();
    
    oauth2Scope
        .post(tokenUri, () => true)
        .reply(oauth2TokenCallback)
        .persist();
    
    oauth2Scope
        .post(tokenInfoUri, () => true)
        .reply(200, {
            scope: Constants.scopes.join(' '),
            email: Constants.Mock.userEmail,
        })
        .persist();
}

export const applyLocalMocks = () => {
    const appScope = nock(localApiBaseUrl);

    appScope
        .post(oauthCallbackUri)
        .reply(function (uri, body) {
            return localPostCallback(uri, body, this.req.headers, googleOAuth2Middleware.redirect);
        })
        .persist();

    appScope
        .get(transactionsUri)
        .reply(function (uri, body) {
            return localGetCallback(uri, body, this.req.headers, transactionsController.get);
        })
        .persist();

    appScope
        .post(transactionsSaveUri)
        .reply(function (uri, body) {
            return localPostCallback(uri, body, this.req.headers, transactionsController.save);
        })
        .persist();

    appScope
        .patch(transactionsUpdateUri)
        .reply(function (uri, body) {
            return localPatchCallback(uri, body, this.req.headers, transactionsController.update);
        })
        .persist();

    appScope
        .get(transactionsLastIdsUri)
        .reply(function (uri, body) {
            return localGetCallback(uri, body, this.req.headers, googleOAuth2Middleware.protect, gmailTransactionsController.getLast);
        })
        .persist();

    appScope
        .post(transactionsGmailResolveUri)
        .reply(function (uri, body) {
            return localPostCallback(uri, body, this.req.headers, googleOAuth2Middleware.protect, gmailTransactionsController.resolve);
        })
        .persist();

    appScope
        .post(groupsUri)
        .reply(function (uri, body) {
            return localPostCallback(uri, body, this.req.headers, groupsController.new);
        })
        .persist();

    appScope
        .get(groupsAllUri)
        .reply(function (uri, body) {
            return localGetCallback(uri, body, this.req.headers, groupsController.getAll);
        })
        .persist();

    appScope
        .get(groupUri)
        .reply(function (uri, body) {
            return localGetCallback(uri, body, this.req.headers, groupsController.get);
        })
        .persist();

    appScope
        .delete(groupUri)
        .reply(function (uri, body) {
            return localDeleteCallback(uri, body, this.req.headers, groupsController.delete);
        })
        .persist();

    appScope
        .post(groupRulesNewUri)
        .reply(function (uri, body) {
            return localPostCallback(uri, body, this.req.headers, groupRulesController.new);
        })
        .persist();

    appScope
        .get(groupRulesAllUri)
        .reply(function (uri, body) {
            return localGetCallback(uri, body, this.req.headers, groupRulesController.getAll);
        })
        .persist();

    appScope
        .get(groupRuleUri)
        .reply(function (uri, body) {
            return localGetCallback(uri, body, this.req.headers, groupRulesController.get);
        })
        .persist();

    appScope
        .delete(groupRuleUri)
        .reply(function (uri, body) {
            return localDeleteCallback(uri, body, this.req.headers, groupRulesController.delete);
        })
        .persist();

    return appScope;
}

const messageListCallback = (uri: string, requestBody: nock.Body) => {
    const pageToken = new URL(gmailApiBaseUrl.concat(uri)).searchParams.get('pageToken');
    const nextPageToken = new TransactionTestHelper()
        .withTestCases(gmailPaymentDetailsTestCases)
        .randomCount(true) // ensure test cases go through at least two pages
        .resolveTransactionIds()
        .reduce((_, i) => i);
        
    return pageToken === null
        ? {
            nextPageToken: nextPageToken,
            messages: new TransactionTestHelper()
                .withTestCases(gmailPaymentDetailsTestCases)
                .resolveTransactionIds(undefined, nextPageToken)
                .map(t => ({ id: t })),
        } : {
            messages: new TransactionTestHelper()
                .withTestCases(gmailPaymentDetailsTestCases)
                .resolveTransactionIds(pageToken)
                .map(t => ({ id: t })),
        };
};

const messageCallback = (uri: string, requestBody: nock.Body) => {
    const matches = uri.match(messageUri);

    if (matches === null) {
        throw new Error(`Failed to resolve message id from URI: ${uri}`);
    }

    const messageId = decodeURIComponent(matches[1]);
    
    if (messageId === Constants.Mock.errorTransactionSourceId) {
        return [500, {
            error: messageId,
        }];
    }

    return [200, {
        id: messageId,
        payload: {
            parts: [{}, {
                body: { 
                    attachmentId: messageId
                }
            }]
        }
    }];
};

const attachmentsCallback = (uri: string, requestBody: nock.Body) => {
    const matches = uri.match(attachmentsUri);

    if (matches === null) {
        throw new Error(`Failed to resolve message id from URI: ${uri}`);
    }

    const messageId = decodeURIComponent(matches[1]);

    if (messageId == Constants.Mock.emptyTransactionSourceId) {
        return "";
    }
    
    const testAttachmentDataBase64 = new TransactionTestHelper()
        .useGmailContext()
        .resolveTransactionDataSource(messageId, true);

    return {
        data: testAttachmentDataBase64
    };
};

const oauth2TokenCallback = (uri: string, requestBody: nock.Body) => {
    const code = new URLSearchParams(requestBody).get('code');

    if (code === Constants.Mock.authorizationCodeError) {
        return [500, {
            error: code,
            error_description: code,
        }];
    }

    return [200, {
        access_token: Constants.Mock.accessToken,
        refresh_token: Constants.Mock.refreshToken,
        redirect_uri: Constants.defaultRedirectUri,
    }];
};

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;

const localGetCallback = async (uri: string, body: nock.Body, headers: Record<string, string>, ...handlers: Array<Handler>) => {
    return localGenericCallback(uri, body, headers, 'GET', ...handlers);
}

const localPostCallback = async (uri: string, body: nock.Body, headers: Record<string, string>, ...handlers: Array<Handler>) => {
    return localGenericCallback(uri, body, headers, 'POST', ...handlers);
}

const localPatchCallback = async (uri: string, body: nock.Body, headers: Record<string, string>, ...handlers: Array<Handler>) => {
    return localGenericCallback(uri, body, headers, 'PATCH', ...handlers);
}

const localDeleteCallback = async (uri: string, body: nock.Body, headers: Record<string, string>, ...handlers: Array<Handler>) => {
    return localGenericCallback(uri, body, headers, 'DELETE', ...handlers);
}

const localGenericCallback = async (uri: string, body: nock.Body, headers: Record<string, string>, method: string, ...handlers: Array<Handler>) => {
    const getHeaderHandler = (name: string) => {
        return headers[name.toLowerCase()];
    };

    const resolveParams = (uri: string) => {
        const matches = uri.replace(/[?].+/, '').match(/\/([^/]+)\/([^/]+)/g) || [];
        return matches.reduce((params, match) => {
            const [key, value] = match.split('/').filter(Boolean);
            params[key] = value;
            return params;
        }, {} as Record<string, string>);
    };

    const request = {
        method: method,
        ...(method === 'POST' || method === 'PATCH') && {
            body: body
        },
        ...(method === 'GET') && {
            query: uri.indexOf('?') < 0 ? {} : queryString.parse(uri.substring(uri.indexOf('?')+1))
        },
        get: getHeaderHandler,
        params: resolveParams(uri),
    } as Request;
    
    let statusCode: number = 0;
    let data: any;

    const statusHandler = (code: number) => {
        statusCode = code;
        return response;
    }

    const jsonHandler = (body?: any) => {
        data = body;
        return response;
    }

    const response = {
        status: statusHandler,
        json: jsonHandler,
        end: () => response,
        locals: {},
    } as Response;

    let currentHandlerId = 0;

    const next = () => handlers.at(++currentHandlerId)?.(request, response, next);

    await handlers.at(0)?.(request, response, next);

    return [statusCode, data];
};
