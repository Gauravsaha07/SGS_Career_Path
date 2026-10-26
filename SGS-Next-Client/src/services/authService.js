import axios from "axios";

const registerUser = async (credentials) => {
    const response = await axios.post("/api/auth/register", credentials);
    if (response.data && response.data.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
};

const loginUser = async (credentials) => {
    const response = await axios.post("/api/auth/login", credentials);
    if (response.data && response.data.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
};

const getMe = async (token) => {
    const response = await axios.get("/api/auth/me", {
        headers: { authorization: `Bearer ${token}` }
    });
    return response.data;
};

const updateProfile = async (formData, token) => {
    const response = await axios.put("/api/auth/profile", formData, {
        headers: { authorization: `Bearer ${token}` }
    });
    if (response.data && response.data.token) {
        localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
};

const fetchQueries = async () => {
    const response = await axios.get("/api/counselor/categories");
    return response.data;
};

const becomeCounselor = async (payload) => {
    const options = {
        headers: {
            authorization: `Bearer ${payload.token}`
        }
    };
    const response = await axios.post("/api/counselor", payload, options);
    return response.data;
};

const authService = {
    loginUser,
    registerUser,
    getMe,
    updateProfile,
    fetchQueries,
    becomeCounselor
};

export default authService;
