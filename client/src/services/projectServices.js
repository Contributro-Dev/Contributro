import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

export const getAllProjects = () =>
    axios.get(`${BASE_URL}/projects/`);

export const getProject = (projectId, token) =>
    axios.get(`${BASE_URL}/projects/${projectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

export const createProject = (projectData, token) =>
    axios.post(`${BASE_URL}/projects/`, projectData, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const joinProject = (projectId, token) =>
    axios.put(`${BASE_URL}/projects/${projectId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const leaveProject = (projectId, token) =>
    axios.put(`${BASE_URL}/projects/${projectId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getJoinRequests = (projectId, token) =>
    axios.get(`${BASE_URL}/projects/${projectId}/join_requests`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const handleJoinRequest = (projectId, requestId, action, token) =>
    axios.put(`${BASE_URL}/projects/${projectId}/join_requests/${requestId}`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getReadme = (projectId, token) =>
    axios.get(`${BASE_URL}/projects/${projectId}/readme`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getCommits = (projectId, token) =>
    axios.get(`${BASE_URL}/projects/${projectId}/commits`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getIssues = (projectId, token) =>
    axios.get(`${BASE_URL}/projects/${projectId}/issues`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getPulls = (projectId, token) =>
    axios.get(`${BASE_URL}/projects/${projectId}/pulls`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const toggleStar = (projectId, token) =>
    axios.put(`${BASE_URL}/projects/${projectId}/star`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getTrendingProjects = () =>
    axios.get(`${BASE_URL}/projects/trending`);

export const getRecentActivity = (token) =>
    axios.get(`${BASE_URL}/projects/activity/recent`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getMyJoinRequests = (token) =>
    axios.get(`${BASE_URL}/projects/users/me/join_requests`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    

//⬇️ ----------------------- UPDATE PROJECT OWNERS ONLY ----------------------- ⬇️

export const updateProject = (projectId, data, token) =>
    axios.put(`${BASE_URL}/projects/${projectId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const deleteProject = (projectId, token) =>
    axios.delete(`${BASE_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const removeMember = (projectId, githubId, token) =>
    axios.delete(`${BASE_URL}/projects/${projectId}/members/${githubId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });