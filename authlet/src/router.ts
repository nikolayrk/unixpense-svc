import express from 'express';
import { OAuth2Service } from './services/oauth2Service';
import { validateClientCredentials } from './middleware/auth';
import { sendResponse } from './utils/response';
import GoogleOAuth2Tokens from '@shared/models/googleOAuth2Tokens.model';

const router = express.Router();

/**
 * @swagger
 * /validate-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Validate Google OAuth2 token
 *     description: Validates an access token and returns the associated email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_token
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: The access token to validate
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token is valid"
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *       401:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid access token"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error: Error message here"
 */


router.post('/validate-token', async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) {
            return sendResponse(res, 400, 'Access token is required');
        }

        const oauth2Service = new OAuth2Service();
        const email = await oauth2Service.resolveEmail(access_token);

        if (!email) {
            return sendResponse(res, 401, 'Invalid access token');
        }

        const tokens = await GoogleOAuth2Tokens.findOne({
            where: { user_email: email }
        });

        if (!tokens) {
            return sendResponse(res, 503, `Reauthorization required for ${email}`);
        }

        try {
            await oauth2Service.validateToken(access_token);
            return sendResponse(res, 200, 'Token is valid', { email });
        } catch (error) {
            return sendResponse(res, 401, 'Invalid access token');
        }
    } catch (error) {
        return sendResponse(res, 500, `Internal server error: ${error.message}`);
    }
});

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Refreshes an access token using the stored refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - access_token
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: The current access token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *       401:
 *         description: Invalid token
 *       404:
 *         description: No refresh token found
 *       500:
 *         description: Server error
 */
router.post('/refresh-token', async (req, res) => {
    try {
        const { access_token } = req.body;
        if (!access_token) {
            return sendResponse(res, 400, 'Access token is required');
        }

        const oauth2Service = new OAuth2Service();
        const email = await oauth2Service.resolveEmail(access_token);

        if (!email) {
            return sendResponse(res, 401, 'Invalid access token');
        }

        const tokens = await GoogleOAuth2Tokens.findOne({
            where: { user_email: email }
        });

        if (!tokens) {
            return sendResponse(res, 404, 'No refresh token found');
        }

        const newTokens = await oauth2Service.refreshTokens(email, tokens.refresh_token);
        return sendResponse(res, 200, 'Token refreshed successfully', {
            access_token: newTokens.access_token
        });
    } catch (error) {
        return sendResponse(res, 500, `Internal server error: ${error.message}`);
    }
});

/**
 * @swagger
 * /callback:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: OAuth2 callback handler
 *     description: Handles the OAuth2 callback and stores tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - client_id
 *               - client_secret
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code
 *               client_id:
 *                 type: string
 *                 description: OAuth2 client ID
 *               client_secret:
 *                 type: string
 *                 description: OAuth2 client secret
 *               redirect_uri:
 *                 type: string
 *                 description: OAuth2 redirect URI
 *     responses:
 *       200:
 *         description: Authorization successful
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Missing authorization code
 *       500:
 *         description: Server error
 */
router.post('/callback', validateClientCredentials, async (req, res) => {
    const { code, redirect_uri } = req.body;

    if (!code) {
        return sendResponse(res, 403, 'No authorization code provided');
    }

    try {
        const oauth2Service = new OAuth2Service(redirect_uri);
        const tokens = await oauth2Service.authorize(code);
        res.status(200).json(tokens);
    } catch (error) {
        return sendResponse(res, 500, `Authorization failed: ${error.message}`);
    }
});

/**
* @swagger
* /healthz:
*   get:
*     tags:
*       - Health
*     summary: Health check endpoint
*     description: Returns service health status
*     responses:
*       200:
*         description: Service is healthy
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: "ok"
*/
router.use('/healthz', (req, res) => {
   res.status(200).json({ status: "ok" });
});

/**
* @swagger
* /alivez:
*   get:
*     tags:
*       - Health
*     summary: Liveness probe endpoint
*     description: Returns service liveness status
*     responses:
*       200:
*         description: Service is alive
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: "ok"
*/
router.use('/alivez', (req, res) => {
   res.status(200).json({ status: "ok" });
});

/**
* @swagger
* /readyz:
*   get:
*     tags:
*       - Health
*     summary: Readiness probe endpoint
*     description: Returns service readiness status
*     responses:
*       200:
*         description: Service is ready
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 status:
*                   type: string
*                   example: "ok"
*/
router.use('/readyz', (req, res) => {
   res.status(200).json({ status: "ok" });
});

export default router;
