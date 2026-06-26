import axios from "axios";

const BASE_URL = "http://localhost:8080/api";

export const createTask = (projectId, data, token) =>
    axios.post(`${BASE_URL}/tasks/project/${projectId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getProjectTasks = (projectId, token) =>
    axios.get(`${BASE_URL}/tasks/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getOwnerUpcomingTasks = (token) =>
    axios.get(`${BASE_URL}/tasks/owner/upcoming`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const getMyUpcomingTasks = (token) =>
    axios.get(`${BASE_URL}/tasks/me/upcoming`, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const updateTask = (taskId, data, token) =>
    axios.put(`${BASE_URL}/tasks/${taskId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });

export const deleteTask = (taskId, token) =>
    axios.delete(`${BASE_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });