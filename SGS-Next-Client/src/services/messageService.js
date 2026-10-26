import axios from "axios";

const fetchConversations = async (token, targetUserId = null) => {
    const options = {
        headers: {
            authorization: `Bearer ${token}`
        },
        params: targetUserId ? { targetUserId } : {}
    };
    const response = await axios.get("/api/messages/conversations", options);
    return response.data;
};

const fetchMessageHistory = async (otherUserId, token) => {
    const options = {
        headers: {
            authorization: `Bearer ${token}`
        }
    };
    const response = await axios.get(`/api/messages/${otherUserId}`, options);
    return response.data;
};

const messageService = {
    fetchConversations,
    fetchMessageHistory
};

export default messageService;
