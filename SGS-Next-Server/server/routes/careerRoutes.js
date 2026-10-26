import express from "express";
import { getAllCareers, getCareerById } from "../controllers/careerController.js";

const router = express.Router();

router.get("/", getAllCareers);
router.get("/:id", getCareerById);

export default router;
