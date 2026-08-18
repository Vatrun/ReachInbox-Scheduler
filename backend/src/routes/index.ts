import { Router } from "express";
import { createCampaign } from "../controllers/campaignsController";
import { getScheduledEmails, getSentEmails } from "../controllers/emailsController";
import { register, login } from "../controllers/authController";
import { getSenders } from "../controllers/sendersController";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);

router.get("/senders", getSenders);

router.post("/campaigns", createCampaign);
router.get("/emails/scheduled", getScheduledEmails);
router.get("/emails/sent", getSentEmails);

export default router;