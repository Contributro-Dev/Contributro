import api from './api.js';

export const connectWithUser = (githubId, token) =>
  api.post(`/api/connections/connect/${githubId}`, {}, { headers: { Authorization: `Bearer ${token}` } });

export const disconnectFromUser = (githubId, token) =>
  api.delete(`/api/connections/connect/${githubId}`, { headers: { Authorization: `Bearer ${token}` } });

export const getMyConnections = (token) =>
  api.get(`/api/connections/my-connections`, { headers: { Authorization: `Bearer ${token}` } });

export const inviteUserToProject = (githubId, projectId, token) =>
  api.post(`/api/connections/invite/${githubId}/${projectId}`, {}, { headers: { Authorization: `Bearer ${token}` } });

export const getMyInvites = (token) =>
  api.get(`/api/connections/my-invites`, { headers: { Authorization: `Bearer ${token}` } });