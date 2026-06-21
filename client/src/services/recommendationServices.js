import api from './api.js';

export const getRecommendedProjects = (token, limit = 10) => {
  return api.get(`/api/recommendations/projects?limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}