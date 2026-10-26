import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/userModel.js"
import Credit from "../models/creditModel.js"
import fs from "node:fs"
import uploadToCloudinary from "../middleware/cloudinaryMiddleware.js"

const registerUser = async (req, res) => {
    let { name, email, phone, password, qualification, location, goal, status } = req.body;

    if (!name || !email || !password) {
        res.status(409);
        throw new Error("Please Fill All Required Details!");
    }

    // Assign standard defaults for career guidance platform if not explicitly passed
    qualification = qualification || status || "Undergraduate Student";
    location = location || "India";

    // Format or validate phone number
    if (!phone) {
        phone = "9" + Math.floor(100000000 + Math.random() * 900000000);
    } else if (phone.length !== 10) {
        res.status(409);
        throw new Error('Invalid Phone Number! Must be 10 digits.');
    }

    // Check if user already exists
    let emailExist = await User.findOne({ email: email.toLowerCase().trim() });
    let phoneExist = await User.findOne({ phone: phone });

    if (emailExist || phoneExist) {
        res.status(409);
        throw new Error('User with this email or phone already exists!');
    }

    // Hash Password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Profile picture: real upload if provided, otherwise deterministic avatar
    let profilePicUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D1A3C&color=FFD84D&bold=true`;
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
        name,
        email: email.toLowerCase().trim(),
        phone,
        password: hashedPassword,
        qualification,
        location,
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
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(409);
        throw new Error("Please fill all details");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
        res.status(401);
        throw new Error("Invalid Credentials");
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
        throw new Error("Invalid Credentials");
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
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (qualification) user.qualification = qualification;
    if (location) user.location = location;

    if (req.file) {
        try {
            const uploadResult = await uploadToCloudinary(req.file.path);
            if (uploadResult && uploadResult.secure_url) {
                user.profilePic = uploadResult.secure_url;
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
