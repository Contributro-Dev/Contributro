import api from './api.js';

export const getAllProjects = () => {
    return api.get('/api/projects');
}

export const getProject = (projectId,token) => {
    return api.get(`/api/projects/${projectId}`);
}

export const createProject = (projectData, token) => {
    return api.post('/api/projects/', projectData, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
}

export const joinProject = (projectId, token) => {
    return api.put(`/api/projects/${projectId}/join`, {}, {
        headers:{'Authorization': `Bearer ${token}`}
    });
}