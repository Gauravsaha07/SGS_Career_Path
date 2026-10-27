import Category from "../models/categoryModel.js";
import Counselor from "../models/counselorModel.js";
import Rating from "../models/ratingModel.js";
import User from "../models/userModel.js";
import Credit from "../models/creditModel.js";
import Message from "../models/messageModel.js";

const DEFAULT_SLOTS = [
    { day: "Friday", time: "05:00 PM IST", active: true },
    { day: "Friday", time: "07:30 PM IST", active: true },
    { day: "Saturday", time: "11:00 AM IST", active: true },
    { day: "Saturday", time: "04:00 PM IST", active: true },
    { day: "Sunday", time: "06:00 PM IST", active: true }
];

const becomeCounselor = async (req, res) => {
    let userId = req.user.id;
    const { category, experience, bio, phone } = req.body;

    if (!category || !experience) {
        res.status(400);
        throw new Error("Please Fill All Details");
    }

    const categoryExist = await Category.findById(category);
    if (!categoryExist) {
        res.status(404);
        throw new Error("Category Not Found!");
    }

    if (experience < 2) {
        res.status(400);
        throw new Error("Experience Must Be 2 or 2+");
    }

    const applicantBio = bio || req.user.bio || `Senior ${categoryExist.title} mentor with ${experience}+ years of professional experience.`;
    const applicantPhone = phone || req.user.phone || "";

    if (phone && !req.user.phone) {
        await User.findByIdAndUpdate(userId, { phone }).catch(() => {});
    }

    const existing = await Counselor.findOne({ user: userId });
    if (existing) {
        if (existing.status === "pending") {
            return res.status(200).json({
                message: "You already have a pending counselor application under review.",
                counselor: existing
            });
        }
        if (existing.status === "accepted") {
            return res.status(200).json({
                message: "You are already an approved counselor.",
                counselor: existing
            });
        }
        // If rejected, allow re-application by updating existing record back to pending
        existing.category = category;
        existing.categoryTitle = categoryExist.title;
        existing.experience = Number(experience);
        existing.status = "pending";
        existing.name = req.user.name;
        existing.email = req.user.email;
        existing.phone = applicantPhone;
        existing.location = req.user.location || "";
        existing.qualification = req.user.qualification || "";
        existing.profilePic = req.user.profilePic || "";
        existing.bio = applicantBio;
        existing.availableSlots = existing.availableSlots?.length ? existing.availableSlots : DEFAULT_SLOTS;
        await existing.save();

        return res.status(200).json({
            message: "Counselor Request Re-submitted. Wait For Admin Approval",
            counselor: existing
        });
    }

    let counselor = await Counselor.create({
        user: userId,
        category,
        categoryTitle: categoryExist.title,
        experience: Number(experience),
        name: req.user.name,
        email: req.user.email,
        phone: applicantPhone,
        location: req.user.location || "",
        qualification: req.user.qualification || "",
        profilePic: req.user.profilePic || "",
        bio: applicantBio,
        availableSlots: DEFAULT_SLOTS
    });

    res.status(201).json({
        message: "Counselor Request Raised Wait For Admin Approval",
        counselor: counselor
    });
};

const getMyApplication = async (req, res) => {
    try {
        let counselor = await Counselor.findOne({ user: req.user.id }).populate('category');
        if (!counselor && req.user.email) {
            counselor = await Counselor.findOne({ email: req.user.email }).populate('category');
        }
        res.status(200).json(counselor || null);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getActiveCounselors = async (req, res) => {
    const counselors = await Counselor.find().populate('user').populate('category');

    if (!counselors) {
        res.status(404);
        throw new Error("Counselors Not Found!");
    }

    // Filter out ghost orphans: must be accepted AND have either a linked user or a direct name
    const activeCounselors = counselors.filter(cn =>
        cn.status === "accepted" &&
        (cn.user != null || (cn.name && cn.name.trim().length > 0))
    );

    // Augment with average rating and fallback fields
    const counselorsWithRating = await Promise.all(activeCounselors.map(async (cn) => {
        const ratings = await Rating.find({ counselor: cn._id });
        const avg = ratings.length > 0
            ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1)
            : "5.0";
        const cnObj = cn.toObject();
        cnObj.avgRating = avg;
        cnObj.totalReviews = ratings.length;
        cnObj.displayName = cn.user?.name || cn.name || "Career Counselor";
        cnObj.displayLocation = cn.user?.location || cn.location || "India";
        cnObj.displayQualification = cn.user?.qualification || cn.qualification || "Verified Counselor";
        cnObj.displayCategory = cn.category?.title || cn.categoryTitle || "Career Mentorship";
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

    const ratings = await Rating.find({ counselor: counselor._id }).populate('user', 'name profilePic');
    const avgRating = ratings.length > 0
        ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1)
        : "5.0";

    const cnObj = counselor.toObject();
    cnObj.avgRating = avgRating;
    cnObj.totalReviews = ratings.length;
    cnObj.ratings = ratings;
    cnObj.availableSlots = (cnObj.availableSlots && cnObj.availableSlots.length > 0)
        ? cnObj.availableSlots
        : DEFAULT_SLOTS;

    cnObj.displayName = counselor.user?.name || counselor.name || "Career Counselor";
    cnObj.displayEmail = counselor.user?.email || counselor.email || "";
    cnObj.displayLocation = counselor.user?.location || counselor.location || "India";
    cnObj.displayQualification = counselor.user?.qualification || counselor.qualification || "Senior Industry Mentor";
    cnObj.displayBio = counselor.user?.bio || counselor.bio || "Senior career counselor offering personalized 1-on-1 guidance.";
    cnObj.displayCategory = counselor.category?.title || counselor.categoryTitle || "Career Mentorship";

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

    const slot = req.body?.slot || "Upcoming Available Slot";
    const topic = req.body?.topic || "1-on-1 Mentorship & Career Guidance";

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

    // Record booking in counselor
    counselor.bookings.push({
        student: student._id,
        studentName: student.name,
        studentEmail: student.email,
        topic,
        slot,
        fee: sessionFee,
        status: "confirmed",
        createdAt: new Date()
    });
    await counselor.save();

    // Create introductory message so both parties immediately have an active conversation in chat
    if (counselor.user && counselor.user._id.toString() !== student._id.toString()) {
        await Message.create({
            sender: student._id,
            receiver: counselor.user._id,
            content: `Hello! I have booked a 1-on-1 session: ${topic} (${slot}). Looking forward to connecting!`
        });
    }

    res.status(200).json({
        message: "Session booked successfully! 50 Credits deducted.",
        remainingCredits: student.credits,
        counselorId: counselor._id,
        counselorName: counselor.user?.name || counselor.name,
        counselorUserId: counselor.user?._id
    });
};

const getCounselorWorkspace = async (req, res) => {
    try {
        let counselor = await Counselor.findOne({ user: req.user.id })
            .populate('category')
            .populate('bookings.student', 'name email profilePic qualification location');

        if (!counselor && req.user.email) {
            counselor = await Counselor.findOne({ email: req.user.email })
                .populate('category')
                .populate('bookings.student', 'name email profilePic qualification location');
        }

        if (!counselor) {
            return res.status(200).json({
                bookings: [],
                availableSlots: DEFAULT_SLOTS,
                ratings: [],
                avgRating: "5.0",
                totalCalls: 0,
                creditsEarned: 0,
                earningsINR: 0,
                walletCredits: req.user.credits || 0
            });
        }

        const ratings = await Rating.find({ counselor: counselor._id }).populate('user', 'name profilePic');
        const avgRating = ratings.length > 0
            ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1)
            : "5.0";

        const bookings = counselor.bookings || [];
        const slots = (counselor.availableSlots && counselor.availableSlots.length > 0)
            ? counselor.availableSlots
            : DEFAULT_SLOTS;

        const sessionCredits = bookings.reduce((sum, b) => sum + (b.fee || 50), 0);

        res.status(200).json({
            counselorId: counselor._id,
            status: counselor.status,
            bookings: bookings.slice().reverse(),
            availableSlots: slots,
            ratings,
            avgRating,
            totalCalls: bookings.length,
            creditsEarned: sessionCredits,
            earningsINR: sessionCredits * 10,
            walletCredits: req.user.credits || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAvailableSlots = async (req, res) => {
    try {
        const { slots } = req.body;
        if (!Array.isArray(slots)) {
            return res.status(400).json({ message: "Invalid slots format. Must be an array." });
        }

        let counselor = await Counselor.findOne({ user: req.user.id });
        if (!counselor && req.user.email) {
            counselor = await Counselor.findOne({ email: req.user.email });
        }

        if (!counselor) {
            return res.status(404).json({ message: "Counselor profile not found." });
        }

        counselor.availableSlots = slots;
        await counselor.save();

        res.status(200).json({
            message: "Availability slots updated successfully!",
            availableSlots: counselor.availableSlots
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCategories = async (req, res) => {
    const categories = await Category.find();

    if (!categories) {
        res.status(404);
        throw new Error("Categories Not Found!");
    }

    res.status(200).json(categories);
};

const counselorController = {
    becomeCounselor,
    getMyApplication,
    getActiveCounselors,
    getCounselorById,
    bookCounselorSession,
    getCounselorWorkspace,
    updateAvailableSlots,
    getCategories
};

export default counselorController;
