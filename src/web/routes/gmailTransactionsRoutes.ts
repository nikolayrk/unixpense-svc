import express from "express";
import * as googleOAuth2Middleware from '../middleware/googleOAuth2Middleware';
import * as gmailTransactionsController from "../controllers/gmailTransactionsController";
import { DependencyInjector } from "../../dependencyInjector";
import bodyParser from "body-parser";

DependencyInjector.Singleton.registerGoogleServices();

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.use('/oauthcallback', googleOAuth2Middleware.redirect);

/**
 * @swagger
 * /api/transactions/gmail/get:
 *   get:
 *     description: Fetch and optionally persist formatted transaction data from Gmail
 *     security:
 *       - Google:
 *         - https://www.googleapis.com/auth/gmail.readonly
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: last
 *         in: query
 *         required: false
 *         type: string
 *       - name: ids
 *         in: query
 *         required: false
 *         type: string
 *       - name: save
 *         in: query
 *         required: false
 *         type: bool
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

export { router };
