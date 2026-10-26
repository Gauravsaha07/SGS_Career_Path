import axios from "axios";

const fetchCareers = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.category && filters.category !== "All Domains") params.append("category", filters.category);
    if (filters.salary && filters.salary !== "Any Salary Range") params.append("salary", filters.salary);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await axios.get(`/api/careers${queryString}`);
    return response.data;
};

const fetchCareerById = async (id) => {
    const response = await axios.get(`/api/careers/${id}`);
    return response.data;
};

const careerService = {
    fetchCareers,
    fetchCareerById
};

export default careerService;
