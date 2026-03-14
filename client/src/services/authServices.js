import api from './api.js';

export const loginWithGithub = () => {

    window.location.href = 'http://localhost:8080/api/auth/github/login';
};

export const getUser = (githubId) => {
  return api.get(`/api/users/${githubId}`)
}

