import Category from "../models/categoryModel.js";
import Counselor from "../models/counselorModel.js";
import Rating from "../models/ratingModel.js";
import User from "../models/userModel.js";
import Credit from "../models/creditModel.js";

const becomeCounselor = async (req, res) => {
    let userId = req.user.id;
    const { category, experience } = req.body;

    if (!category || !experience) {
        res.status(409);
        throw new Error("Please Fill All Details");
    }

    const categoryExist = await Category.findById(category);
    if (!categoryExist) {
        res.status(404);
        throw new Error("Category Not Found!");
    }

    if (experience < 2) {
        res.status(409);
        throw new Error("Experience Must Be 2 or 2+");
    }

    let counselor = await Counselor.create({
        user: userId,
        category,
        experience
    });

    if (!counselor) {
        res.status(409);
        throw new Error("Counselor Not Created!");
    }

    res.status(201).json({
        message: "Counselor Request Raised Wait For Admin Approval",
        counselor: counselor
    });
};

const getActiveCounselors = async (req, res) => {
    const counselors = await Counselor.find().populate('user').populate('category');

    if (!counselors) {
        res.status(404);
        throw new Error("Counselors Not Found!");
    }

    const activeCounselors = counselors.filter(counselor => counselor.status === "accepted");

    // Augment with average rating
    const counselorsWithRating = await Promise.all(activeCounselors.map(async (cn) => {
        const ratings = await Rating.find({ counselor: cn._id });
        const avg = ratings.length > 0 ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1) : "5.0";
        const cnObj = cn.toObject();
        cnObj.avgRating = avg;
        cnObj.totalReviews = ratings.length;
        return cnObj;
    }));

    res.status(200).json(counselorsWithRating);
};

const getCounselorById = async (req, res) => {
    const counselor = await Counselor.findById(req.params.id).populate('user').populate('category');
    if (!counselor) {
        res.status(404);
        throw new Error("Counselor Not Found!");
    }

    const ratings = await Rating.find({ counselor: counselor._id }).populate('user');
    const avgRating = ratings.length > 0 ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1) : "5.0";

    const cnObj = counselor.toObject();
    cnObj.avgRating = avgRating;
    cnObj.totalReviews = ratings.length;
    cnObj.ratings = ratings;

    res.status(200).json(cnObj);
};

const bookCounselorSession = async (req, res) => {
    const student = await User.findById(req.user.id);
    if (!student) {
        res.status(404);
        throw new Error("User Not Found!");
    }

    const counselor = await Counselor.findById(req.params.id).populate('user');
    if (!counselor) {
        res.status(404);
        throw new Error("Counselor Not Found!");
    }

    const sessionFee = 50;
    if (student.credits < sessionFee) {
        res.status(400);
        throw new Error(`Insufficient credits! You need ${sessionFee} credits to book a session.`);
    }

    // Deduct from student
    student.credits -= sessionFee;
    await student.save();

    // Credit to counselor user
    if (counselor.user) {
        await User.findByIdAndUpdate(counselor.user._id, { $inc: { credits: sessionFee } });
    }

    // Record credit transaction
    await Credit.create({
        user: student._id,
        credits: -sessionFee,
        status: "granted"
    });

    res.status(200).json({
        message: "Session booked successfully! 50 Credits deducted.",
        remainingCredits: student.credits,
        counselorId: counselor._id,
        counselorName: counselor.user?.name,
        counselorUserId: counselor.user?._id
    });
};

const getCategories = async (req, res) => {
    const categories = await Category.find();

    if (!categories) {
        res.status(404);
        throw new Error("Categories Not Found!");
    }

    res.status(200).json(categories);
};

const counselorController = { becomeCounselor, getActiveCounselors, getCounselorById, bookCounselorSession, getCategories };
export default counselorController;
