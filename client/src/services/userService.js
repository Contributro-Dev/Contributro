import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

export const getUserProfile = (githubId) =>
    axios.get(`${BASE_URL}/users/${githubId}`);

export const updateSkills = (githubId, data, token) =>
    axios.patch(`${BASE_URL}/users/${githubId}/skills`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getMe = (token) =>
    axios.get(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const updateMe = (data, token) =>
    axios.put(`${BASE_URL}/users/me`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getPublicProfile = (username) =>
    axios.get(`${BASE_URL}/users/profile/${username}`);

export const getMyActivity = (token) =>
    axios.get(`${BASE_URL}/users/me/activity`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const postActivity = (data, token) =>
    axios.post(`${BASE_URL}/users/activity`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getGithubContributions = (token) =>
    axios.get(`${BASE_URL}/users/me/github-contributions`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getGithubStats = (token) =>
    axios.get(`${BASE_URL}/users/me/github-stats`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getGithubLanguages = (token) =>
    axios.get(`${BASE_URL}/users/me/github-languages`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getTopContributors = () =>
    axios.get(`${BASE_URL}/users/top-contributors`);



export const getUsersByIds = (ids, token) =>
    axios.get(`${BASE_URL}/users/`, {
        params: { ids: ids.join(',') },
        headers: { Authorization: `Bearer ${token}` }
    });

export const getPublicGithubStats = (username) =>
    axios.get(`${BASE_URL}/users/profile/${username}/github-stats`);

export const getPublicGithubContributions = (username) =>
    axios.get(`${BASE_URL}/users/profile/${username}/github-contributions`);


export const getJoinRequests = (projectId, token) =>
    axios.get(`${BASE_URL}/projects/${projectId}/join_requests`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const handleJoinRequest = (projectId, requestId, action, token) =>
    axios.put(`${BASE_URL}/projects/${projectId}/join_requests/${requestId}`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const leaveProject = (projectId, token) =>
    axios.put(`${BASE_URL}/projects/${projectId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });