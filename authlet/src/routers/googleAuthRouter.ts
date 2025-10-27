import express from 'express';
import { validateToken, refreshToken, handleCallback } from '../controllers/googleAuthController';
import { validateClientCredentials } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /google/validate-token:
 *   post:
 *     tags:
 *       - Google
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
 *       400:
 *         description: Access token is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access token is required"
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
 *       503:
 *         description: Reauthorization required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reauthorization required for user@example.com"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error: ..."
 */
router.post('/validate-token', validateToken);

/**
 * @swagger
 * /google/refresh-token:
 *   put:
 *     tags:
 *       - Google
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
 *                   example: "Token refreshed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     access_token:
 *                       type: string
 *                       description: The new access token
 *       400:
 *         description: Access token is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access token is required"
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
 *       404:
 *         description: No refresh token found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No refresh token found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error: ..."
 */
router.put('/refresh-token', refreshToken);

/**
 * @swagger
 * /google/callback:
 *   post:
 *     tags:
 *       - Google
 *     summary: OAuth2 callback handler
 *     description: Handles the OAuth2 callback and stores tokens. Returns Google Credentials object.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Google Credentials object from google-auth-library
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: OAuth2 access token
 *                 refresh_token:
 *                   type: string
 *                   description: OAuth2 refresh token
 *                 scope:
 *                   type: string
 *                   description: Granted scopes
 *                 token_type:
 *                   type: string
 *                   description: Token type (typically "Bearer")
 *                 expiry_date:
 *                   type: number
 *                   description: Token expiry timestamp in milliseconds
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid client credentials"
 *       403:
 *         description: Missing authorization code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No authorization code provided"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authorization failed: ..."
 */
router.post('/callback', validateClientCredentials, handleCallback);

export default router;
