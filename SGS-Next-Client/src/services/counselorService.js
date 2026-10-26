import axios from "axios";

const fetchCounselors = async () => {
    const response = await axios.get("/api/counselor");
    return response.data;
};

const fetchCounselorById = async (id) => {
    const response = await axios.get(`/api/counselor/${id}`);
    return response.data;
};

const bookSession = async (id, bookingDataOrToken, possibleToken) => {
    let payload = {};
    let token = null;

    if (typeof bookingDataOrToken === "string") {
        token = bookingDataOrToken;
    } else if (typeof bookingDataOrToken === "object" && bookingDataOrToken !== null) {
        payload = bookingDataOrToken;
        token = possibleToken;
    }

    const response = await axios.post(`/api/counselor/${id}/book`, payload, {
        headers: { authorization: `Bearer ${token}` }
    });
    return response.data;
};

const fetchMyWorkspace = async (token) => {
    const response = await axios.get("/api/counselor/workspace", {
        headers: { authorization: `Bearer ${token}` }
    });
    return response.data;
};

const updateSlots = async (slots, token) => {
    const response = await axios.put("/api/counselor/slots", { slots }, {
        headers: { authorization: `Bearer ${token}` }
    });
    return response.data;
};

const fetchMyApplication = async (token) => {
    const response = await axios.get("/api/counselor/my-application", {
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
    fetchMyWorkspace,
    updateSlots,
    fetchMyApplication,
    fetchRatings,
    addRating
};

export default counselorService;
