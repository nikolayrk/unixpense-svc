import express from "express";
import * as googleOAuth2Middleware from '../middleware/googleOAuth2Middleware';
import * as gmailTransactionsController from "../controllers/gmailTransactionsController";
import { DependencyInjector } from "../../dependencyInjector";
import bodyParser from "body-parser";
import swaggerJSDoc from "swagger-jsdoc";

DependencyInjector.Singleton.registerGmailServices();

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.use('/oauthcallback', googleOAuth2Middleware.redirect);

/**
 * @swagger
 * /transactions/gmail/get:
 *   get:
 *     tags:
 *       - Gmail
 *     description: Fetch and optionally persist formatted transaction data from Gmail
 *     security:
 *       - Google:
 *         - https://www.googleapis.com/auth/userinfo.profile
 *         - https://www.googleapis.com/auth/userinfo.email
 *         - https://www.googleapis.com/auth/gmail.readonly
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: User-Email
 *         in: header
 *         required: true
 *         type: string
 *       - name: last
 *         in: query
 *         required: false
 *         type: integer
 *       - name: ids
 *         in: query
 *         required: false
 *         type: string
 *       - name: save
 *         in: query
 *         required: false
 *         type: boolean
 *     responses:
 *       200:
 *         description: Transaction data result
 *       400:
 *         description: Request error
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction data processing error
 *       503:
 *         description: Service error
 */
router.route('/get').get(googleOAuth2Middleware.protect, gmailTransactionsController.get);

const swaggerComponents: swaggerJSDoc.Components = {
    securitySchemes: {
        Google: {
            type: 'oauth2',
            flows: {
                authorizationCode: {
                    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline',
                    tokenUrl: `${process.env.NODE_ENV === 'production'
                            ? `https://${process.env.UNIXPENSE_HOST}${process.env.UNIXPENSE_HOST_PREFIX ?? ''}`
                            : `http://${process.env.HOSTNAME ?? 'localhost'}:${process.env.PORT ?? 8000}`
                        }/api/transactions/gmail/oauthcallback`,
                    scopes: {
                        'https://www.googleapis.com/auth/userinfo.profile': 'See your personal info, including any personal info you\'ve made publicly available',
                        'https://www.googleapis.com/auth/userinfo.email': 'See your primary Google Account email address',
                        'https://www.googleapis.com/auth/gmail.readonly': 'View your email messages and settings',
                    }
                }
            }
        }
    }
};

export { router, swaggerComponents };
