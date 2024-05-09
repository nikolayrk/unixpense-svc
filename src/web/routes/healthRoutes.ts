import express from "express";

const router = express.Router();

router.use('/healthz', (req, res) => res.status(200).json({ status: "ok" }));
router.use('/alivez', (req, res) => res.status(200).json({ status: "ok" }));
router.use('/readyz', (req, res) => res.status(200).json({ status: "ok" }));

export { router };