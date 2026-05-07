import api from './api.js';

export const getUserProfile = (token, githubId) => {
    return api.get(`/api/users/${githubId}`, {
        headers:{'Authorization': `Bearer ${token}`}
    });
}

export const updateSkills = (token, githubId, data) => {
    return api.patch(`/api/users/${githubId}/skills`, data, {
        headers:{'Authorization': `Bearer ${token}`}
    });
}