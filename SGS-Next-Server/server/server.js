import express from "express"
import dotenv from "dotenv"
dotenv.config()
import colors from "colors"
import http from "http"
import compression from "compression"
import { Server } from "socket.io";
import socketAuthMiddleware from "./socket/socketAuth.js";
import { chatHandler } from "./socket/chatHandler.js"

// Local Imports
import connectDB from "./config/dbConfig.js"
import authRoutes from "./routes/authRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import counselorRoutes from "./routes/counselorRoutes.js"
import ratingRoutes from "./routes/ratingsRoutes.js"
import errorHandler from "./middleware/errorHandler.js"
import creditRoutes from "./routes/creditRoutes.js"
import aiRoutes from "./routes/roadmapRoutes.js"
import careerRoutes from "./routes/careerRoutes.js"
import messageRoutes from "./routes/messageRoutes.js"

const PORT = process.env.PORT || 5000

const app = express()
app.use(compression())
const server = http.createServer(app)

// DB CONNECTION
connectDB()


// Socket Config
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || ["http://localhost:5173", "http://localhost:5511"],
        credentials: true
    }
})

io.use(socketAuthMiddleware)

io.on("connection", (socket) => {
    console.log(`User connected : ${socket.userId}`)
    chatHandler(io, socket)
})


// Body-Parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))



app.get("/", (req, res) => {
    res.status(200).json({
        message: "WELCOME TO NEXT STEP API 1.0"
    })
})


// Auth Routes
app.use("/api/auth", authRoutes)

// Admin Routes
app.use("/api/admin", adminRoutes)

// Counselor Route
app.use("/api/counselor", counselorRoutes)

// Careers Route (Public / Student)
app.use("/api/careers", careerRoutes)

// Rating Routes
app.use("/api/rating", ratingRoutes)

// Credit Routes
app.use("/api/credit", creditRoutes)

// A.I Routes
app.use("/api/ai", aiRoutes)

// Chat & Message Routes
app.use("/api/messages", messageRoutes)

// Error Handler
app.use(errorHandler)



server.listen(PORT, () => {
    console.log(`SERVER IS RUNNING AT PORT : ${PORT}`.bgGreen.black)
})
