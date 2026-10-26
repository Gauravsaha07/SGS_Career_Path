import express from "express";
import {
    generateRoadmap,
    getMyRoadmaps,
    getRoadmapById,
    deleteRoadmap,
    updateRoadmap
} from "../controllers/roadmapController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/roadmap", protect.forUser, generateRoadmap);
router.get("/my-roadmaps", protect.forUser, getMyRoadmaps);
router.get("/roadmap/:id", protect.forUser, getRoadmapById);
router.delete("/roadmap/:id", protect.forUser, deleteRoadmap);
router.put("/roadmap/:id", protect.forUser, updateRoadmap);

export default router;
