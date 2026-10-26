import axios from "axios";

const fetchCounselors = async () => {
    const response = await axios.get("/api/counselor");
    return response.data;
};

const fetchCounselorById = async (id) => {
    const response = await axios.get(`/api/counselor/${id}`);
    return response.data;
};

const bookSession = async (id, token) => {
    const response = await axios.post(`/api/counselor/${id}/book`, {}, {
        headers: { authorization: `Bearer ${token}` }
    });
    return response.data;
};

const fetchRatings = async (counselorId, token) => {
    const response = await axios.get(`/api/rating/${counselorId}`, {
        headers: { authorization: `Bearer ${token}` }
    });
    return response.data;
};

const addRating = async (counselorId, ratingData, token) => {
    const response = await axios.post(`/api/rating/${counselorId}`, ratingData, {
        headers: { authorization: `Bearer ${token}` }
    });
    return response.data;
};

const counselorService = {
    fetchCounselors,
    fetchCounselorById,
    bookSession,
    fetchRatings,
    addRating
};

export default counselorService;
