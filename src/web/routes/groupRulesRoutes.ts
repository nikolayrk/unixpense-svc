import express from "express";
import * as groupRulesController from '../controllers/groupRulesController';

const router = express.Router();

/**
 * @swagger
 * /groups/{group}/rules:
 *   post:
 *     tags:
 *       - Groups
 *       - Rules
 *     description: Create a new Transaction Group Rule
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: group
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       description: Rule configuration object
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#components/schemas/groupRuleConfig'
 *     responses:
 *       201:
 *         description: Confirmation for the successfully added Group Rule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Added 1 group rule to database
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/').post(groupRulesController.new);

/**
 * @swagger
 * /groups/{group}/rules/{rule_id}:
 *   get:
 *     tags:
 *       - Groups
 *       - Rules
 *     description: Get a Transaction Group Rule.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: group
 *         in: path
 *         required: true
 *         type: string
 *       - name: rule_id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Group Rule object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/groupRule'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/:id').get(groupRulesController.get);

/**
 * @swagger
 * /groups/{group}/rules/all:
 *   get:
 *     tags:
 *       - Groups
 *       - Rules
 *     description: Get all Transaction Group Rules for a Group.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: group
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Array of Group objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#components/schemas/groupRule'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/all').get(groupRulesController.getAll);

/**
 * @swagger
 * /groups/{group}/rules/{rule_id}:
 *   delete:
 *     tags:
 *       - Groups
 *       - Rules
 *     description: Delete a Transaction Group Rule
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: group
 *         in: path
 *         required: true
 *         type: string
 *       - name: rule_id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       204:
 *         description: Confirmation for the successfully deleted Rule
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/:id').delete(groupRulesController.delete);

export { router };