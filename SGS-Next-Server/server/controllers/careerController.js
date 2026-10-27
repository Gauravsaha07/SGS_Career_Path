import Career from "../models/careerModel.js";

export const getAllCareers = async (req, res) => {
    try {
        const { search, category, salary } = req.query;
        let query = {};

        if (category && category !== "All Domains") {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { skills: { $regex: search, $options: "i" } }
            ];
        }

        const careers = await Career.find(query).populate("category");
        res.status(200).json(careers);
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

export const getCareerById = async (req, res) => {
    try {
        const career = await Career.findById(req.params.id).populate("category");
        if (!career) {
            res.status(404);
            throw new Error("Career Not Found!");
        }
        res.status(200).json(career);
    } catch (error) {
        const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
        res.status(status);
        throw new Error(error.message);
    }
};

const careerController = { getAllCareers, getCareerById };
export default careerController;
