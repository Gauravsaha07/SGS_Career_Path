import { GoogleGenAI } from "@google/genai";
import User from "../models/userModel.js";
import Career from "../models/careerModel.js";
import Category from "../models/categoryModel.js";
import Rating from "../models/ratingModel.js";
import Credit from "../models/creditModel.js";
import Counselor from "../models/counselorModel.js";
import Roadmap from "../models/roadmapModel.js";

export const generateRoadmap = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

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

    const SYSTEM_PROMPT = `You are "CareerPath AI" — an expert career counselor and curriculum advisor 
specializing in the Indian subcontinent education and job market (India, 
Pakistan, Bangladesh, Nepal, Sri Lanka). You help students go from their 
current qualification to a clear, actionable career path in their field 
of interest.

Your goal is to generate a comprehensive, realistic, and structured 
career roadmap tailored to the student's background, constraints, and goals.

The student will provide the following inputs:
- Name: ${name}
- Email: ${email}
- Current Qualification: ${qualification}
- Location: ${location}
- Target Interest / Dream Role: ${interest}
- Current Skill Level: ${skill_level}
- Budget: ${budget}
- Preferred Learning Mode: ${learning_mode}
- Additional Info / Context: ${additional_info || "None"}

Generate a detailed roadmap organized into phases:
Phase 1: Foundations & Core Concepts (Months 1-2)
Phase 2: Deep Dive, Projects & Tools (Months 3-4)
Phase 3: Advanced Topics, Portfolio & Deployment (Month 5)
Phase 4: Interview Preparation, Placement & Next Steps (Month 6)

Include concrete milestones, key skills, and actionable next steps for the Indian job market.`;

    const ai = new GoogleGenAI({});
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: SYSTEM_PROMPT,
    });

    let data = interaction.output_text;

    // Deduct credits AFTER successful generation
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { credits: -1 } },
      { returnDocument: 'after' }
    );

    // Record credit transaction
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
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 409;
    res.status(statusCode);
    throw new Error(error.message);
  }
};

export const getMyRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(roadmaps);
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
};

export const getRoadmapById = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user.id });
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
    const { question } = req.body;

    if (!question) {
      res.status(409);
      throw new Error("Question Not Found!");
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503);
      throw new Error("AI Assistant unavailable: Missing GEMINI_API_KEY.");
    }

    const users = await User.find();
    const careers = await Career.find();
    const categories = await Category.find();
    const ratings = await Rating.find();
    const credit = await Credit.find();
    const counselor = await Counselor.find();

    const dataset = [users, careers, categories, ratings, credit, counselor];

    const SYSTEM_PROMPT = `You are a smart AI assistant for CareerBridge platform. Answer the question about the provided platform data clearly and concisely. If unknown, state no data available.
Dataset: ${JSON.stringify(dataset)}
Question: ${question}`;

    const ai = new GoogleGenAI({});
    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: SYSTEM_PROMPT,
    });

    let data = interaction.output_text;

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
