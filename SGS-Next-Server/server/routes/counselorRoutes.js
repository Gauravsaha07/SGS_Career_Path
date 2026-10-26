import express from "express";
import protect from "../middleware/authMiddleware.js";
import counselorController from "../controllers/counselorController.js";

const router = express.Router();

router.post("/", protect.forUser, counselorController.becomeCounselor);
router.get("/", counselorController.getActiveCounselors);
router.get("/categories", counselorController.getCategories);
router.get("/:id", counselorController.getCounselorById);
router.post("/:id/book", protect.forUser, counselorController.bookCounselorSession);

export default router;
