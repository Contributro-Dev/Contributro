import api from './api.js';

export const getAllProjects = () => {
    return api.get('/api/projects');
}

export const getProject = (projectId, token) => {
    return api.get(`/api/projects/${projectId}`);
}

export const createProject = (projectData, token) => {
    return api.post('/api/projects/', projectData, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const joinProject = (projectId, token) => {
    return api.put(`/api/projects/${projectId}/join`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const getJoinRequests = (projectId, token) => {
    return api.get(`/api/projects/${projectId}/join_requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const getMyJoinRequests = (token) => {
    return api.get('/api/projects/users/me/join_requests', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const handleJoinRequest = (projectId, requestId, action, token) => {
  return api.put(`/api/projects/${projectId}/join_requests/${requestId}`, { action }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

export const getReadme = (projectId, token) => {
    return api.get(`/api/projects/${projectId}/readme`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const getCommits = (projectId, token) => {
    return api.get(`/api/projects/${projectId}/commits`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const getIssues = (projectId, token) => {
    return api.get(`/api/projects/${projectId}/issues`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const getPulls = (projectId, token) => {
    return api.get(`/api/projects/${projectId}/pulls`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}