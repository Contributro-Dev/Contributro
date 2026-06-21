export const getReadme = (projectId, token) =>
  api.get(`/projects/${projectId}/readme`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getCommits = (projectId, token) =>
  api.get(`/projects/${projectId}/commits`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getIssues = (projectId, token) =>
  api.get(`/projects/${projectId}/issues`, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getPulls = (projectId, token) =>
  api.get(`/projects/${projectId}/pulls`, {
    headers: { Authorization: `Bearer ${token}` }
  });