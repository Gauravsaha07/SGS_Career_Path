import axios from "axios";

const generateRoadmap = async (payload) => {
    const options = {
        headers: {
            authorization: `Bearer ${payload.token}`
        }
    };
    const response = await axios.post("/api/ai/roadmap", payload, options);
    return response.data;
};

const fetchMyRoadmaps = async (token) => {
    const options = {
        headers: {
            authorization: `Bearer ${token}`
        }
    };
    const response = await axios.get("/api/ai/my-roadmaps", options);
    return response.data;
};

const deleteRoadmap = async (id, token) => {
    const options = {
        headers: {
            authorization: `Bearer ${token}`
        }
    };
    const response = await axios.delete(`/api/ai/roadmap/${id}`, options);
    return response.data;
};

const updateRoadmap = async (id, payload, token) => {
    const options = {
        headers: {
            authorization: `Bearer ${token}`
        }
    };
    const response = await axios.put(`/api/ai/roadmap/${id}`, payload, options);
    return response.data;
};

const roadmapService = {
    generateRoadmap,
    fetchMyRoadmaps,
    deleteRoadmap,
    updateRoadmap
};

export default roadmapService;
