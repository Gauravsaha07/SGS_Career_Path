import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Credit from "../models/creditModel.js";
import Counselor from "../models/counselorModel.js";
import fs from "node:fs";
import uploadToCloudinary from "../middleware/cloudinaryMiddleware.js";

// Helper: Normalize phone to 10 digits
export const normalizePhone = (input) => {
    if (!input) return "";
    let cleaned = input.toString().replace(/\D/g, "");
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
        cleaned = cleaned.slice(2);
    } else if (cleaned.length === 11 && cleaned.startsWith("0")) {
        cleaned = cleaned.slice(1);
    }
    return cleaned;
};

// Helper: Validate 10-digit Indian mobile number (starts with 6-9)
export const isValidIndianPhone = (phone) => {
    return /^[6-9]\d{9}$/.test(phone);
};

const registerUser = async (req, res) => {
    let { name, email, phone, password, qualification, location, goal, status } = req.body;

    if (!name || !name.trim()) {
        res.status(400);
        throw new Error("Please enter your full name!");
    }

    if (!email || !email.trim()) {
        res.status(400);
        throw new Error("Please enter your email address!");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        res.status(400);
        throw new Error("Please enter a valid email address!");
    }

    if (!phone || !phone.toString().trim()) {
        res.status(400);
        throw new Error("Please enter your 10-digit mobile number!");
    }

    const normalizedPhone = normalizePhone(phone);
    if (!isValidIndianPhone(normalizedPhone)) {
        res.status(400);
        throw new Error("Please enter a valid 10-digit Indian mobile number (starts with 6-9)!");
    }

    if (!location || !location.trim()) {
        res.status(400);
        throw new Error("Please enter your location (City, State)!");
    }

    if (!password || password.length < 6) {
        res.status(400);
        throw new Error("Password must be at least 6 characters long!");
    }

    qualification = qualification || status || "College Student (Undergrad)";

    // Uniqueness checks: separate 409 checks for email and phone
    const emailExist = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExist) {
        res.status(409);
        throw new Error("User with this email already exists!");
    }

    const phoneExist = await User.findOne({
        $or: [{ phone: normalizedPhone }, { phone: phone.toString().trim() }]
    });
    if (phoneExist) {
        res.status(409);
        throw new Error("User with this mobile number already exists!");
    }

    // Hash Password (10 rounds)
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Profile picture: real upload if provided, otherwise deterministic avatar
    let profilePicUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=0D1A3C&color=FFD84D&bold=true`;
    if (req.file) {
        try {
            const uploadResult = await uploadToCloudinary(req.file.path);
            if (uploadResult && uploadResult.secure_url) {
                profilePicUrl = uploadResult.secure_url;
            }
        } catch (e) {
            console.error("Cloudinary upload failed, using default avatar:", e.message);
        } finally {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }
    }

    const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: normalizedPhone,
        password: hashedPassword,
        qualification,
        location: location.trim(),
        credits: 100, // 100 free welcome credits as stated across landing and registration
        profilePic: profilePicUrl
    });

    if (!user) {
        res.status(409);
        throw new Error('User not created!');
    }

    // Record welcome bonus transaction
    await Credit.create({
        user: user._id,
        credits: 100,
        status: "granted"
    });

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        location: user.location,
        qualification: user.qualification,
        credits: user.credits,
        isActive: user.isActive,
        userSince: user.createdAt,
        profilePic: user.profilePic,
        token: generateToken(user._id)
    });
};

const loginUser = async (req, res) => {
    // Accepts identifier (or email for backward compatibility) and password
    const { identifier, email, password } = req.body;
    const loginTarget = identifier || email;

    if (!loginTarget || !password) {
        res.status(409);
        throw new Error("Please fill all details");
    }

    if (password.length < 6) {
        res.status(401);
        throw new Error("Invalid credentials");
    }

    let user = null;
    const trimmedTarget = loginTarget.trim();

    if (trimmedTarget.includes("@")) {
        // Query by email
        user = await User.findOne({ email: trimmedTarget.toLowerCase() });
    } else {
        // Query by mobile number (normalized and raw)
        const normalizedPhone = normalizePhone(trimmedTarget);
        user = await User.findOne({
            $or: [
                { phone: normalizedPhone },
                { phone: trimmedTarget }
            ]
        });
    }

    if (!user) {
        res.status(401);
        throw new Error("Invalid credentials");
    }

    if (!user.isActive) {
        res.status(401);
        throw new Error("Your Account Has Been Suspended. Contact Admin!");
    }

    if (user && bcrypt.compareSync(password, user.password)) {
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            userType: user.userType,
            location: user.location,
            qualification: user.qualification,
            credits: user.credits,
            isActive: user.isActive,
            userSince: user.createdAt,
            profilePic: user.profilePic,
            token: generateToken(user._id)
        });
    } else {
        res.status(401);
        throw new Error("Invalid credentials");
    }
};

const getMe = async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
        res.status(404);
        throw new Error("User Not Found");
    }
    res.status(200).json(user);
};

const updateProfile = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        res.status(404);
        throw new Error("User Not Found");
    }

    const { name, phone, qualification, location } = req.body;
    if (name && name.trim()) user.name = name.trim();

    if (phone && phone.toString().trim()) {
        const normalizedPhone = normalizePhone(phone);
        if (!isValidIndianPhone(normalizedPhone)) {
            res.status(400);
            throw new Error("Please enter a valid 10-digit Indian mobile number (starts with 6-9)!");
        }
        const phoneExist = await User.findOne({
            phone: normalizedPhone,
            _id: { $ne: user._id }
        });
        if (phoneExist) {
            res.status(409);
            throw new Error("User with this mobile number already exists!");
        }
        user.phone = normalizedPhone;
    }

    if (qualification && qualification.trim()) user.qualification = qualification.trim();
    if (location && location.trim()) user.location = location.trim();

    if (req.file) {
        try {
            const uploadResult = await uploadToCloudinary(req.file.path);
            if (uploadResult && uploadResult.secure_url) {
                user.profilePic = uploadResult.secure_url;
                await Counselor.findOneAndUpdate(
                    { user: user._id },
                    { profilePic: uploadResult.secure_url }
                );
            }
        } catch (e) {
            console.error("Cloudinary upload failed during profile update:", e.message);
        } finally {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }
    }

    const updatedUser = await user.save();

    res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        userType: updatedUser.userType,
        location: updatedUser.location,
        qualification: updatedUser.qualification,
        credits: updatedUser.credits,
        isActive: updatedUser.isActive,
        profilePic: updatedUser.profilePic,
        token: generateToken(updatedUser._id)
    });
};

const privateController = async (req, res) => {
    res.json({
        message: "Request Made By : " + req.user.name
    });
};

// Generate Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const authController = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    privateController
};

export default authController;
