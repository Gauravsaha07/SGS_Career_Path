import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from "colors";
import bcrypt from "bcryptjs";
import connectDB from "./server/config/dbConfig.js";
import Category from "./server/models/categoryModel.js";
import Career from "./server/models/careerModel.js";
import User from "./server/models/userModel.js";
import Counselor from "./server/models/counselorModel.js";

dotenv.config();

const defaultCategories = [
    { title: "Software Engineering" },
    { title: "Data & Analytics" },
    { title: "Design & Product" },
    { title: "Government & PSU" },
    { title: "Infrastructure & DevOps" },
    { title: "Management & Consulting" },
    { title: "Commerce & Finance" },
    { title: "Medical & Healthcare" }
];

export const seedDatabase = async () => {
    try {
        const conn = await connectDB();
        if (!conn) {
            console.error("Database connection could not be established.");
            return;
        }
        console.log("🌱 Running idempotent database seed check...");

        // 1. Seed Categories if missing
        let categoriesAdded = 0;
        for (const cat of defaultCategories) {
            const exists = await Category.findOne({ title: cat.title });
            if (!exists) {
                await Category.create(cat);
                categoriesAdded++;
            }
        }
        const allCategories = await Category.find();
        console.log(`ℹ️ Categories verified (Total: ${allCategories.length}, Newly Added: ${categoriesAdded}).`);

        const catMap = {};
        allCategories.forEach(c => { catMap[c.title] = c._id; });
        const defaultCatId = allCategories[0]?._id;

        // 2. Seed Careers if missing
        const sampleCareers = [
            {
                title: 'Full-Stack Web Engineer',
                category: catMap['Software Engineering'] || catMap['Computer Science & IT'] || defaultCatId,
                salary: '₹6L - ₹18L / year',
                duration: '6 Months',
                requiredQualification: 'B.Tech / BCA / MCA / Self-taught',
                openings: '14,200+ Openings',
                badge: 'TOP CHOICE',
                skills: ['React', 'Node.js', 'PostgreSQL', 'Tailwind', 'Docker'],
                description: 'Build end-to-end web applications for top Indian tech startups and MNCs.'
            },
            {
                title: 'Data Analyst & BI Specialist',
                category: catMap['Data & Analytics'] || catMap['Data Science & Artificial Intelligence'] || defaultCatId,
                salary: '₹5L - ₹12L / year',
                duration: '4 Months',
                requiredQualification: 'B.Sc / B.Com / B.Tech / Statistics',
                openings: '9,800+ Openings',
                badge: 'POPULAR',
                skills: ['SQL', 'Python', 'PowerBI', 'Excel', 'Tableau'],
                description: 'Transform raw business metrics into actionable growth dashboards.'
            },
            {
                title: 'UI/UX Product Designer',
                category: catMap['Design & Product'] || catMap['Design & Creative Arts'] || defaultCatId,
                salary: '₹5L - ₹14L / year',
                duration: '5 Months',
                requiredQualification: 'Any Degree / Design Portfolio',
                openings: '4,500+ Openings',
                badge: 'CREATIVE',
                skills: ['Figma', 'User Research', 'Wireframing', 'Prototyping'],
                description: 'Craft intuitive mobile apps and web experiences for millions of Indian users.'
            },
            {
                title: 'UPSC Civil Services Officer',
                category: catMap['Government & PSU'] || catMap['Government & Civil Services'] || defaultCatId,
                salary: '₹7L - ₹15L + Govt Perks',
                duration: '12 Months',
                requiredQualification: 'Any Recognized Bachelor Degree',
                openings: '1,000+ Vacancies/yr',
                badge: 'GOVT ROLE',
                skills: ['General Studies', 'Public Policy', 'Ethics', 'Essay Writing'],
                description: 'Serve the nation in administrative, police, or foreign services.'
            },
            {
                title: 'Cloud & DevOps Engineer',
                category: catMap['Infrastructure & DevOps'] || catMap['Engineering & Technology'] || defaultCatId,
                salary: '₹8L - ₹22L / year',
                duration: '6 Months',
                requiredQualification: 'B.Tech CSE / IT / BCA',
                openings: '7,300+ Openings',
                badge: 'HIGH SALARY',
                skills: ['AWS', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux'],
                description: 'Manage automated deployments and scalable cloud infrastructure on AWS & Azure.'
            },
            {
                title: 'Associate Product Manager',
                category: catMap['Design & Product'] || catMap['Business & Management'] || defaultCatId,
                salary: '₹10L - ₹24L / year',
                duration: '6 Months',
                requiredQualification: 'Engineering / MBA',
                openings: '3,200+ Openings',
                badge: 'HOT TRACK',
                skills: ['Roadmapping', 'Agile', 'Data Analytics', 'User Feedback'],
                description: 'Lead cross-functional teams to build impactful products from 0 to 1.'
            }
        ];

        let careersAdded = 0;
        for (const car of sampleCareers) {
            const exists = await Career.findOne({ title: car.title });
            if (!exists) {
                await Career.create(car);
                careersAdded++;
            }
        }
        const totalCareers = await Career.countDocuments();
        console.log(`ℹ️ Careers verified (Total: ${totalCareers}, Newly Added: ${careersAdded}).`);

        // 3. Seed Sample Counselor if none exist
        const counselorCount = await Counselor.countDocuments();
        if (counselorCount === 0) {
            const counselorEmail = "mentor.ramesh@careerbridge.in";
            let mentorUser = await User.findOne({ email: counselorEmail });

            if (!mentorUser) {
                const salt = bcrypt.genSaltSync(10);
                mentorUser = await User.create({
                    name: "Dr. Ramesh Kumar",
                    email: counselorEmail,
                    phone: "9876543210",
                    password: bcrypt.hashSync("MentorPass@123", salt),
                    userType: "COUNSELOR",
                    qualification: "Ph.D. Computer Science, IIT Bombay",
                    location: "Bengaluru, Karnataka",
                    credits: 100,
                    isActive: true,
                    profilePic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
                });
                console.log("✅ Created sample mentor user: Dr. Ramesh Kumar");
            }

            await Counselor.create({
                user: mentorUser._id,
                category: catMap['Software Engineering'] || catMap['Engineering & Technology'] || defaultCatId,
                experience: 14,
                isActive: true,
                isAvailable: true,
                status: "accepted"
            });
            console.log("✅ Seeded verified counselor profile for Dr. Ramesh Kumar.");
        } else {
            console.log(`ℹ️ ${counselorCount} counselors already exist. Skipping counselor insertion.`);
        }

        console.log("🎉 Idempotent database check complete.");
    } catch (error) {
        console.error("❌ Seeding Error:", error);
    }
};

seedDatabase().then(() => {
    mongoose.connection.close();
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
