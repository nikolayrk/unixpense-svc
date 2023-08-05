import express from "express";
import * as groupsController from '../controllers/groupsController';
import { router as groupRulesRouter } from './groupRulesRoutes';

const router = express.Router();

/**
 * @swagger
 * /groups:
 *   post:
 *     tags:
 *       - Groups
 *     description: Create a new Transaction Group
 *     produces:
 *       - application/json
 *     requestBody:
 *       description: Group configuration object
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Groceries
 *     responses:
 *       201:
 *         description: Confirmation for the successfully added Group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Added 1 group to database
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/').post(groupsController.new);

/**
 * @swagger
 * /groups/all:
 *   get:
 *     tags:
 *       - Groups
 *     description: Get all Transactions Groups and their Rules.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Array of Group objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#components/schemas/group'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/all').get(groupsController.getAll);

/**
 * @swagger
 * /groups/{group}:
 *   get:
 *     tags:
 *       - Groups
 *     description: Get a Transaction Group and its Rules.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: group
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Group object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/group'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/:group').get(groupsController.get);

/**
 * @swagger
 * /groups/{group}:
 *   delete:
 *     tags:
 *       - Groups
 *     description: Delete a Transaction Group
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: group
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       204:
 *         description: Confirmation for the successfully deleted Group
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/:group').delete(groupsController.delete);

router.use('/:group/rules', groupRulesRouter);

export { router };