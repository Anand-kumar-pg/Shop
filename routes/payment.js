import express from "express";
const router = express.Router();

import {isAuthenticatedUser } from '../middlewares/auth.js';
import { stripeCheckOutSession, stripeWebhook } from "../controllers/paymentControllers.js";


router.route("/payment/checkout_session").post(isAuthenticatedUser, stripeCheckOutSession);
router.route("/payment/webhook").post(stripeWebhook);




export default router;

