import express from "express";
import * as gmailTransactionsController from "../controllers/gmailTransactionsController";

const router = express.Router();

/**
 * @swagger
 * /transactions/gmail/ids/last/{last}:
 *   get:
 *     tags:
 *       - Transactions
 *       - Gmail
 *     description: "Get the IDs of the requested number of latest Gmail transactions.\n\n*[Optional]* Skip persisted entries\n\n*[Optional]* Constrain the result to a number of consecutively skipped entries"
 *     security:
 *       - Google:
 *         - https://www.googleapis.com/auth/userinfo.profile
 *         - https://www.googleapis.com/auth/userinfo.email
 *         - https://www.googleapis.com/auth/gmail.readonly
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: last
 *         in: path
 *         required: true
 *         type: integer
 *       - name: skip_saved
 *         in: query
 *         required: false
 *         type: boolean
 *         default: false
 *       - name: skip_depth
 *         in: query
 *         required: false
 *         type: integer
 *       - name: X-Refresh-Token
 *         in: header
 *         required: false
 *         type: string
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/ids/last/:last').get(gmailTransactionsController.getLast);

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
 *       - name: X-Refresh-Token
 *         in: header
 *         required: false
 *         type: string
 *     requestBody:
 *       description: Array of transaction IDs to resolve.
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
 *         description: Array of Gmail transaction data objects
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/resolve').post(gmailTransactionsController.resolve);

export { router };
