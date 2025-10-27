import express from 'express';

const router = express.Router();

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
