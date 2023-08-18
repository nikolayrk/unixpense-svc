import express from "express";
import * as transactionsController from "../controllers/transactionsController";

const router = express.Router();

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
