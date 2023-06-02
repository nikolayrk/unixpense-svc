import bodyParser from "body-parser";
import express from "express";
import * as googleOAuth2Middleware from '../middleware/googleOAuth2Middleware';
import * as groupRulesController from '../controllers/groupRulesController';

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.use(express.json());

/**
 * @swagger
 * /groups/{group}/rules:
 *   post:
 *     tags:
 *       - Groups
 *       - Rules
 *     description: Create a new Transaction Group Rule
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
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/').post(googleOAuth2Middleware.protect, groupRulesController.new);

/**
 * @swagger
 * /groups/{group}/rules/{rule_id}:
 *   get:
 *     tags:
 *       - Groups
 *       - Rules
 *     description: Get a Transaction Group Rule.
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
 *         description: Group object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/groupRule'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/:id').get(googleOAuth2Middleware.protect, groupRulesController.get);

/**
 * @swagger
 * /groups/{group}/rules/all:
 *   get:
 *     tags:
 *       - Groups
 *       - Rules
 *     description: Get a Transaction Group Rule.
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
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/all').get(googleOAuth2Middleware.protect, groupRulesController.getAll);

/**
 * @swagger
 * /groups/{group}/rules/{rule_id}:
 *   delete:
 *     tags:
 *       - Groups
 *       - Rules
 *     description: Delete a Transaction Group Rule
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
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/:id').delete(googleOAuth2Middleware.protect, groupRulesController.delete);

export { router };