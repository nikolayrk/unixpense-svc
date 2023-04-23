import express from "express";
import { get } from "../controllers/transactionsController";

const router = express.Router();

router.route('/get').get(get);

export { router };
