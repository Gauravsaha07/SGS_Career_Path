import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Fill Name!"]
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Please Fill Email!"]
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        required: false
    },
    password: {
        type: String,
        required: [true, "Please Fill Password!"],
        minlength: [6, "Password must be at least 6 characters!"]
    },
    userType: {
        type: String,
        required: true,
        enum: ["STUDENT", "COUNSELOR", "ADMIN"],
        default: "STUDENT"
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
    qualification: {
        type: String,
        required: false
    },
    location: {
        type: String,
        required: false
    },
    credits: {
        type: Number,
        default: 5,
        required: true
    },
    profilePic: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);

export default User;
