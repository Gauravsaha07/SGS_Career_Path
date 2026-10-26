import express from "express";
import { getConversations, getMessageHistory } from "../controllers/messageController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/conversations", protect.forUser, getConversations);
router.get("/:otherUserId", protect.forUser, getMessageHistory);

export default router;
