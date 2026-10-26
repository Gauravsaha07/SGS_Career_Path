import mongoose from "mongoose";

const roadmapSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    title: {
        type: String,
        default: "Career Roadmap"
    },
    interest: {
        type: String
    },
    progress: {
        type: Number,
        default: 0
    },
    completedPhases: {
        type: [Number],
        default: []
    }
}, {
    timestamps: true
})

const Roadmap = mongoose.model("Roadmap", roadmapSchema)

export default Roadmap
