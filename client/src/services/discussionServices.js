// client/src/services/discussionServices.js
import api from './api.js';

const h = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getDiscussions = (projectId, token) =>
  api.get(`/api/discussions/${projectId}`, h(token));

export const createDiscussion = (projectId, data, token) =>
  api.post(`/api/discussions/${projectId}`, data, h(token));

export const getDiscussion = (projectId, discussionId, token) =>
  api.get(`/api/discussions/${projectId}/${discussionId}`, h(token));

export const addReply = (projectId, discussionId, text, token) =>
  api.post(`/api/discussions/${projectId}/${discussionId}/reply`, { text }, h(token));

export const likeDiscussion = (discussionId, token) =>
  api.put(`/api/discussions/${discussionId}/like`, {}, h(token));

export const likeReply = (replyId, token) =>
  api.put(`/api/discussions/reply/${replyId}/like`, {}, h(token));

export const acceptReply = (discussionId, replyId, token) =>
  api.put(`/api/discussions/${discussionId}/accept/${replyId}`, {}, h(token));

export const pinDiscussion = (discussionId, token) =>
  api.put(`/api/discussions/${discussionId}/pin`, {}, h(token));

export const deleteDiscussion = (discussionId, token) =>
  api.delete(`/api/discussions/${discussionId}`, h(token));