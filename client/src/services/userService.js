import api from './api.js';

export const getUserProfile = (token, githubId) => {
    return api.get(`/api/users/${githubId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const updateSkills = (token, githubId, data) => {
    return api.patch(`/api/users/${githubId}/skills`, data, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const getMe = (token) => {
    return api.get('/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const updateMe = (token, data) => {
    return api.put('/api/users/me', data, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const getPublicProfile = (username) => {
    return api.get(`/api/users/profile/${username}`);
};

export const getMyActivity = (token) => {
    return api.get('/api/users/me/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const postActivity = (token, type, message, metadata = {}) => {
    return api.post('/api/users/activity', { type, message, metadata }, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const getGithubContributions = (token) => {
    return api.get('/api/users/me/github-contributions', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const getGithubStats = (token) => {
    return api.get('/api/users/me/github-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const getGithubLanguages = (token) => {
    return api.get('/api/users/me/github-languages', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};

export const getPublicGithubStats = (username) => {
    return api.get(`/api/users/profile/${username}/github-stats`);
};

export const getPublicGithubContributions = (username) => {
    return api.get(`/api/users/profile/${username}/github-contributions`);
};


export const getUsersByIds = (token, ids) => {
    return api.get(`/api/users/by-ids?ids=${ids.join(',')}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
};