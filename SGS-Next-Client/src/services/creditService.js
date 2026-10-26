import axios from "axios";

const requestCredits = async (credits, token) => {
    const options = {
        headers: {
            authorization: `Bearer ${token}`
        }
    };
    const response = await axios.post("/api/credit", { credits: Number(credits) }, options);
    return response.data;
};

const fetchCreditHistory = async (token) => {
    const options = {
        headers: {
            authorization: `Bearer ${token}`
        }
    };
    const response = await axios.get("/api/credit", options);
    return response.data;
};

const creditService = {
    requestCredits,
    fetchCreditHistory
};

export default creditService;
