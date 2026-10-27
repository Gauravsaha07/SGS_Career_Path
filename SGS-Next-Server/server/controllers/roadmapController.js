import { GoogleGenAI } from "@google/genai";
import User from "../models/userModel.js";
import Career from "../models/careerModel.js";
import Category from "../models/categoryModel.js";
import Rating from "../models/ratingModel.js";
import Credit from "../models/creditModel.js";
import Counselor from "../models/counselorModel.js";
import Roadmap from "../models/roadmapModel.js";

const roadmapCache = new Map();
const adminAiCache = new Map();

const getCachedItem = (cache, key, ttlMs) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }
  return item.value;
};

const setCachedItem = (cache, key, value) => {
  if (cache.size > 200) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { value, timestamp: Date.now() });
};

const callGemini = async (prompt, retries = 1, timeoutMs = 40000) => {
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
  const ai = new GoogleGenAI({});

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents: prompt
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini request timed out")), timeoutMs)
      );

      const res = await Promise.race([callPromise, timeoutPromise]);
      if (res && res.text) {
        return res.text;
      }
      throw new Error("No output generated from Gemini AI");
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 800));
    }
  }
};

export const generateRoadmap = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("credits name email qualification location");

    if (!user) {
      res.status(404);
      throw new Error("User Not Found!");
    }

    if (user.credits < 1) {
      res.status(400);
      throw new Error("Insufficient Credits! You need at least 1 credit to generate an AI roadmap.");
    }

    const { name, email, qualification, location } = user;
    const { interest, skill_level, budget, learning_mode, additional_info } = req.body;

    if (!interest || !skill_level || !budget || !learning_mode) {
      res.status(409);
      throw new Error("Please Fill All Details!");
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503);
      throw new Error("AI service unavailable: Missing GEMINI_API_KEY. Please set it in .env");
    }

    const cacheKey = `${interest.toLowerCase().trim()}_${skill_level.toLowerCase()}_${learning_mode.toLowerCase()}`;
    let data = getCachedItem(roadmapCache, cacheKey, 60 * 60 * 1000);

    if (!data) {
      const SYSTEM_PROMPT = `You are "CareerPath AI" — an expert career counselor and curriculum advisor 
specializing in the Indian subcontinent education and job market.
Generate a comprehensive, realistic, and structured career roadmap tailored to the student:
- Target Role: ${interest}
- Current Level: ${qualification || "Undergrad"} (${skill_level})
- Location: ${location || "India"}
- Budget: ${budget}
- Mode: ${learning_mode}
${additional_info ? `Context: ${additional_info}` : ""}

Provide a detailed learning path with 4 structured phases:
Phase 1: Foundations & Core Concepts (Months 1-2)
Phase 2: Deep Dive, Projects & Tools (Months 3-4)
Phase 3: Advanced Topics, Portfolio & Deployment (Month 5)
Phase 4: Interview Preparation & Placement in India (Month 6)
Include key milestones, tools, and salary expectations in INR.`;

      data = await callGemini(SYSTEM_PROMPT, 1, 40000);
      setCachedItem(roadmapCache, cacheKey, data);
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { credits: -1 } },
      { returnDocument: 'after' }
    );

    await Credit.create({
      user: user._id,
      credits: -1,
      status: "granted"
    });

    const roadmap = await Roadmap.create({
      text: data,
      user: user._id,
      title: `${interest} Roadmap`,
      interest: interest,
      progress: 25,
      completedPhases: [1]
    });

    res.status(200).json({
      message: "Roadmap generated",
      roadmap: roadmap,
      remainingCredits: updatedUser.credits
    });

  } catch (error) {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode);
    throw new Error(error.message);
  }
};

export const getMyRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    res.status(200).json(roadmaps);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
};

export const getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!roadmap) {
      res.status(404);
      throw new Error("Roadmap not found");
    }
    res.status(200).json(roadmap);
  } catch (error) {
    res.status(404);
    throw new Error(error.message);
  }
};

export const deleteRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!roadmap) {
      res.status(404);
      throw new Error("Roadmap not found");
    }
    res.status(200).json({ message: "Roadmap deleted successfully" });
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
};

export const updateRoadmap = async (req, res) => {
  try {
    const { progress, completedPhases } = req.body;
    const roadmap = await Roadmap.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        $set: {
          ...(progress !== undefined && { progress }),
          ...(completedPhases !== undefined && { completedPhases })
        }
      },
      { returnDocument: 'after' }
    );

    if (!roadmap) {
      res.status(404);
      throw new Error("Roadmap not found");
    }
    res.status(200).json(roadmap);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
};

export const adminAiChat = async (req, res) => {
  try {
    const question = req.body.question || req.body.text;

    if (!question || !question.trim()) {
      res.status(409);
      throw new Error("Question Not Found!");
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503);
      throw new Error("AI Assistant unavailable: Missing GEMINI_API_KEY.");
    }

    const cacheKey = question.toLowerCase().trim();
    let data = getCachedItem(adminAiCache, cacheKey, 10 * 60 * 1000);

    if (!data) {
      const [userCount, counselorCount, careerDocs, categoryDocs, creditSummary] = await Promise.all([
        User.countDocuments(),
        Counselor.countDocuments({ status: "accepted" }),
        Career.find().select("title salary duration openings").lean(),
        Category.find().select("title").lean(),
        Credit.aggregate([{ $group: { _id: "$status", total: { $sum: "$credits" } } }])
      ]);

      const circulatingCredits = creditSummary.find(c => c._id === 'granted')?.total || 0;

      const SYSTEM_PROMPT = `You are a helpful admin AI supervisor for CareerBridge India platform.
Platform Live Snapshot:
- Total Registered Users: ${userCount}
- Verified Active Counselors: ${counselorCount}
- Popular Career Tracks: ${careerDocs.map(c => `${c.title} (${c.salary})`).join("; ")}
- Available Categories: ${categoryDocs.map(c => c.title).join(", ")}
- Circulating Credits: ${circulatingCredits} Credits

Answer the admin question concisely and accurately based on the platform snapshot above:
Question: ${question.trim()}`;

      data = await callGemini(SYSTEM_PROMPT, 1, 20000);
      setCachedItem(adminAiCache, cacheKey, data);
    }

    res.status(200).json({
      message: "Response Arrived",
      answer: data
    });

  } catch (error) {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 409;
    res.status(statusCode);
    throw new Error(error.message || "Unable to respond");
  }
};
