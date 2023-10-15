import express from "express";
import * as transactionsController from "../controllers/transactionsController";

const router = express.Router();

/**
 * @swagger
 * /transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     description: Queries the transactions table for entries matching the provided filters
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: fromDate
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: 2020-03-13
 *       - name: toDate
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: 2020-05-13
 *       - name: fromSum
 *         in: query
 *         required: false
 *         type: integer
 *         example: 10
 *       - name: toSum
 *         in: query
 *         required: false
 *         type: integer
 *         example: 1000
 *       - name: types
 *         in: query
 *         required: false
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/transactionTypes'
 *       - name: entryTypes
 *         in: query
 *         required: false
 *         explode: false
 *         schema:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/entryTypes'
 *     responses:
 *       200:
 *         description: A collection of Gmail transaction data objects
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
 *       500:
 *         description: Processing error
 *       503:
 *         description: Service error
 */
router.route('/').get(transactionsController.get);

/**
 * @swagger
 * /transactions/save:
 *   post:
 *     tags:
 *       - Transactions
 *     description: Save the provided transactions to the database
 *     produces:
 *       - application/json
 *     requestBody:
 *       description: Array of transactions to save.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
*                oneOf:
 *                 - $ref: '#/components/schemas/cardOperationTransaction'
 *                 - $ref: '#/components/schemas/standardTransferTransaction'
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/save').post(transactionsController.save);

export { router };
