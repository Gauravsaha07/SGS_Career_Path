import Career from "../models/careerModel.js"
import Category from "../models/categoryModel.js"
import Counselor from "../models/counselorModel.js"
import Credit from "../models/creditModel.js"
import Roadmap from "../models/roadmapModel.js"
import User from "../models/userModel.js"

const getUsers = async (req, res) => {

    const users = await User.find()

    if (!users) {
        res.status(404)
        throw new Error("No Users Found!")
    }

    res.status(201).json(users)

}


const createCategory = async (req, res) => {

    if (!req.body.title) {
        res.status(409)
        throw new Error("Please Enter Category Title")
    }

    const category = await Category.create({ title: req.body.title })

    if (!category) {
        res.status(409)
        throw new Error("Category not created!")
    }

    res.status(201).json(category)

}

const getCategories = async (req, res) => {



    const categories = await Category.find()

    if (!categories) {
        res.status(404)
        throw new Error("Categories not found!")
    }

    res.status(200).json(categories)

}


const createCareer = async (req, res) => {

    const { title, description, requiredQualification, duration, salary } = req.body

    if (!title || !description || !requiredQualification || !duration || !salary) {
        res.status(409)
        throw new Error("Please Fill All Details!")
    }

    const categoryId = req.params.cid

    const career = await Career.create({
        category: categoryId,
        title,
        description,
        requiredQualification,
        duration,
        salary
    })


    if (!career) {
        res.status(409)
        throw new Error("Career Not Created!")
    }

    res.status(201).json(career)


}

const getCareers = async (req, res) => {
    const careers = await Career.find().populate('category')

    if (!careers) {
        res.status(404)
        throw new Error("No Carrers Found")
    }

    res.status(200).json(careers)

}


const getCounselors = async (req, res) => {
    const counselors = await Counselor.find().populate('category').populate('user').lean();

    if (!counselors) {
        res.status(404);
        throw new Error("Counselors Not Found!");
    }

    const sanitized = counselors.map(c => ({
        ...c,
        user: c.user || {
            _id: null,
            name: c.name || "Applicant (User Deleted)",
            email: c.email || "deleted@careerbridge.in",
            phone: c.phone || "N/A",
            location: c.location || "Unknown Location",
            qualification: c.qualification || "N/A",
            profilePic: c.profilePic || "",
            credits: 0
        },
        category: c.category || {
            _id: null,
            title: c.categoryTitle || "General / Uncategorized"
        }
    }));

    res.status(200).json(sanitized);
};


const updateCounselor = async (req, res) => {

    const counselor = await Counselor.findById(req.params.cnid);

    if (!counselor) {
        res.status(404);
        throw new Error('Counselor Not Found');
    }

    const updatedCounselor = await Counselor.findByIdAndUpdate(
        counselor._id,
        req.body,
        { returnDocument: 'after' }
    ).populate('user').populate('category').lean();

    if (req.body.status === "accepted" && counselor.user) {
        const userDoc = await User.findByIdAndUpdate(counselor.user, { userType: "COUNSELOR" }, { returnDocument: 'after' });
        if (userDoc) {
            await Counselor.findByIdAndUpdate(counselor._id, {
                name: userDoc.name,
                email: userDoc.email,
                phone: userDoc.phone,
                qualification: userDoc.qualification,
                location: userDoc.location,
                profilePic: userDoc.profilePic,
                isActive: true,
                isAvailable: true
            });
        }
    } else if (req.body.status === "rejected" && counselor.user) {
        await User.findByIdAndUpdate(counselor.user, { userType: "STUDENT" });
        await Counselor.findByIdAndUpdate(counselor._id, { isActive: false });
    }

    if (!updatedCounselor) {
        res.status(409);
        throw new Error("Counselor not updated");
    }

    const sanitized = {
        ...updatedCounselor,
        user: updatedCounselor.user || {
            _id: null,
            name: updatedCounselor.name || "Applicant (User Deleted)",
            email: updatedCounselor.email || "deleted@careerbridge.in",
            phone: updatedCounselor.phone || "N/A",
            location: updatedCounselor.location || "Unknown Location",
            qualification: updatedCounselor.qualification || "N/A",
            profilePic: updatedCounselor.profilePic || "",
            credits: 0
        },
        category: updatedCounselor.category || {
            _id: null,
            title: updatedCounselor.categoryTitle || "General / Uncategorized"
        }
    };

    res.status(200).json(sanitized);

};

const getAllCreditRequests = async (req, res) => {

    const creditsRequests = await Credit.find().populate('user')

    if (!creditsRequests) {
        res.status(404)
        throw new Error("No Credits Requests Found")
    }

    res.status(200).json(creditsRequests)

}

const updateCredit = async (req, res) => {

    const { status } = req.body

    if (!status) {
        res.status(409)
        throw new Error("Please send status")
    }

    const creditRequest = await Credit.findById(req.params.rid)



    if (!creditRequest) {
        res.status(404)
        throw new Error("Credit Request Not Found!")
    }

    const user = await User.findById(creditRequest.user)


    if (!user) {
        res.status(404)
        throw new Error("No User Found!")
    }



    if (status === "granted") {
        const updatedUser = await User.findByIdAndUpdate(user._id, { credits: user.credits + creditRequest.credits }, { new: true })
    }

    const updatedCreditRequest = await Credit.findByIdAndUpdate(creditRequest._id, { status }, { new: true })



    res.status(200).json(updatedCreditRequest)


}


const getAllRoadmaps = async (req, res) => {
    const roadmaps = await Roadmap.find().populate('user')

    if (!roadmaps) {
        res.status(404)
        throw new Error("Roadmaps Not Found")
    }

    res.status(200).json(roadmaps)


}

const updateUser = async (req, res) => {

    const userId = req.params.uid

    const user = await User.findById(userId)

    if (!user) {
        res.status(404)
        throw new Error("User Not Exist")
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, { isActive: !user.isActive }, { returnDocument: 'after' })

    if (!updatedUser) {
        res.status(409)
        throw new Error("User Not Updated!")
    }
    res.status(200).json(updatedUser)
}



const adminController = { getUsers, createCategory, getCategories, createCareer, getCareers, getCounselors, updateCounselor, getAllCreditRequests, updateCredit, getAllRoadmaps, updateUser }

export default adminController