import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
    day: { type: String, required: true },
    time: { type: String, required: true },
    active: { type: Boolean, default: true }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    studentName: { type: String, default: "Student Mentee" },
    studentEmail: { type: String, default: "" },
    topic: { type: String, default: "1-on-1 Mentorship & Career Guidance" },
    slot: { type: String, default: "Upcoming Available Slot" },
    fee: { type: Number, default: 50 },
    status: { type: String, enum: ["confirmed", "pending", "completed", "cancelled"], default: "confirmed" },
    createdAt: { type: Date, default: Date.now }
});

const counselorSchema = new mongoose.Schema({
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    // Fallback fields for direct MongoDB insertions
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    qualification: { type: String, trim: true },
    bio: { type: String, trim: true },
    location: { type: String, trim: true },
    profilePic: { type: String },
    categoryTitle: { type: String },
    experience: {
        type: Number,
        default: 3,
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ["accepted", "pending", "rejected"],
        default: "pending"
    },
    availableSlots: [slotSchema],
    bookings: [bookingSchema]
}, {
    timestamps: true
});

const Counselor = mongoose.model("Counselor", counselorSchema);

export default Counselor;
