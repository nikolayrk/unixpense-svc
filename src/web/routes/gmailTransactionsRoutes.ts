import express from "express";
import * as googleOAuth2Middleware from '../middleware/googleOAuth2Middleware';
import * as gmailTransactionsController from "../controllers/gmailTransactionsController";
import bodyParser from "body-parser";
import swaggerJSDoc from "swagger-jsdoc";

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.use(express.json());

router.use('/oauthcallback', googleOAuth2Middleware.redirect);

/**
 * @swagger
 * /transactions/gmail/get/last/{last}:
 *   get:
 *     tags:
 *       - Transactions
 *       - Gmail
 *     description: Get the IDs of the requested number of latest Gmail transactions
 *     security:
 *       - Google:
 *         - https://www.googleapis.com/auth/userinfo.profile
 *         - https://www.googleapis.com/auth/userinfo.email
 *         - https://www.googleapis.com/auth/gmail.readonly
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: X-User-Email
 *         in: header
 *         required: true
 *         type: string
 *       - name: last
 *         in: path
 *         required: true
 *         type: integer
 *       - name: skip_depth
 *         in: query
 *         type: integer
 *         description: Constrain the result to a number of consecutively skipped entries
 *       - name: skip_saved
 *         in: query
 *         required: false
 *         type: boolean
 *         description: Should persisted (saved) transactions be skipped
 *         default: false
 *     responses:
 *       200:
 *         description: Array of Gmail Message IDs (transaction IDs)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: 1773e8e6b4cff981
 *       400:
 *         description: Bad request
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/get/last/:last').get(googleOAuth2Middleware.protect, gmailTransactionsController.getLast);

/**
 * @swagger
 * /transactions/gmail/resolve:
 *   post:
 *     tags:
 *       - Transactions
 *       - Gmail
 *     description: Resolve Gmail transactions by their respective transaction IDs
 *     security:
 *       - Google:
 *         - https://www.googleapis.com/auth/userinfo.profile
 *         - https://www.googleapis.com/auth/userinfo.email
 *         - https://www.googleapis.com/auth/gmail.readonly
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: X-User-Email
 *         in: header
 *         required: true
 *         type: string
 *     requestBody:
 *       description: Array of Gmail Message IDs of the messages holding the data for the requested transactions.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *               example: 1773e8e6b4cff981
 *     responses:
 *       200:
 *         description: Array of the data for each requested transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/cardOperationTransaction'
 *                   - $ref: '#/components/schemas/standardTransferTransaction'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/resolve').post(googleOAuth2Middleware.protect, gmailTransactionsController.resolve);

/**
 * @swagger
 * /transactions/gmail/save:
 *   post:
 *     tags:
 *       - Transactions
 *       - Gmail
 *     description: Save the requested transactions to the database
 *     security:
 *       - Google:
 *         - https://www.googleapis.com/auth/userinfo.profile
 *         - https://www.googleapis.com/auth/userinfo.email
 *         - https://www.googleapis.com/auth/gmail.readonly
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: X-User-Email
 *         in: header
 *         required: true
 *         type: string
 *     requestBody:
 *       description: Array of Gmail Message IDs of the messages holding the data for the requested transactions.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *               example: 1773e8e6b4cff981
 *     responses:
 *       201:
 *         description: Confirmation for the number of successfully added transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Added 1 transaction to database
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/save').post(googleOAuth2Middleware.protect, gmailTransactionsController.save);

const swaggerComponents: swaggerJSDoc.Components = {
    securitySchemes: {
        Google: {
            type: 'oauth2',
            flows: {
                authorizationCode: {
                    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline',
                    tokenUrl: `${process.env.NODE_ENV === 'production'
                            ? `https://${process.env.UNIXPENSE_HOST}${process.env.UNIXPENSE_HOST_PREFIX ?? ''}`
                            : `http://${process.env.HOSTNAME ?? 'localhost'}:${process.env.PORT ?? 8000}${process.env.UNIXPENSE_HOST_PREFIX ?? ''}`
                        }/api/transactions/gmail/oauthcallback`,
                    scopes: {
                        'https://www.googleapis.com/auth/userinfo.profile': 'See your personal info, including any personal info you\'ve made publicly available',
                        'https://www.googleapis.com/auth/userinfo.email': 'See your primary Google Account email address',
                        'https://www.googleapis.com/auth/gmail.readonly': 'View your email messages and settings',
                    }
                }
            }
        }
    },
};

export { router, swaggerComponents };
