// client/src/services/messageServices.js
import api from './api.js';

export const getConversation = (otherId, token) =>
  api.get(`/api/messages/${otherId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const sendMessage = (toId, text, token, extras = {}) =>
  api.post(
    `/api/messages/`,
    { to_id: toId, text, attachment: extras.attachment || null, reply_to: extras.replyTo || null },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const getConversationsSummary = (token) =>
  api.get(`/api/messages/conversations-summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const uploadAttachment = (formData, token) =>
  api.post(`/api/messages/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

export const markMessagesRead = (otherId, token) =>
  api.put(
    `/api/messages/read`,
    { other_id: otherId },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const deleteMessage = (msgId, token) =>
  api.delete(`/api/messages/${msgId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });