import bodyParser from "body-parser";
import express from "express";
import * as googleOAuth2Middleware from '../middleware/googleOAuth2Middleware';
import * as groupsController from '../controllers/groupsController';
import { router as groupRulesRouter } from './groupRulesRoutes';

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));

router.use(express.json());

/**
 * @swagger
 * /groups:
 *   post:
 *     tags:
 *       - Groups
 *     description: Create a new Transaction Group
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
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/').post(googleOAuth2Middleware.protect, groupsController.new);

/**
 * @swagger
 * /groups/{group}:
 *   get:
 *     tags:
 *       - Groups
 *     description: Get a Transaction Group and its Rules.
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
 *         description: Group object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#components/schemas/group'
 *       400:
 *         description: Bad request
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/:group').get(googleOAuth2Middleware.protect, groupsController.get);

/**
 * @swagger
 * /groups/all:
 *   get:
 *     tags:
 *       - Groups
 *     description: Get all Transactions Groups and their Rules.
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
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/all').get(googleOAuth2Middleware.protect, groupsController.getAll);

/**
 * @swagger
 * /groups/{group}:
 *   delete:
 *     tags:
 *       - Groups
 *     description: Delete a Transaction Group
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
 *       204:
 *         description: Confirmation for the successfully deleted Group
 *       403:
 *         description: Authorization error
 *       500:
 *         description: Transaction processing error
 *       503:
 *         description: Service error
 */
router.route('/:group').delete(googleOAuth2Middleware.protect, groupsController.delete);

router.use('/:group/rules', groupRulesRouter);

export { router };