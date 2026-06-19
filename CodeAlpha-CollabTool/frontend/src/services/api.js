import axios from 'axios';

// ─── Central Axios instance ────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ─── Request Interceptor: Auto-attach JWT from localStorage ───────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('collabtool_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 globally ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear local storage and redirect to login
      localStorage.removeItem('collabtool_token');
      localStorage.removeItem('collabtool_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

// ─── Boards API ───────────────────────────────────────────────────────────
export const boardsAPI = {
  getAll: () => api.get('/boards'),
  getById: (boardId) => api.get(`/boards/${boardId}`),
  create: (data) => api.post('/boards', data),
  update: (boardId, data) => api.patch(`/boards/${boardId}`, data),
  delete: (boardId) => api.delete(`/boards/${boardId}`),
  invite: (boardId, email) => api.post(`/boards/${boardId}/invite`, { email }),
  getStats: (boardId) => api.get(`/boards/${boardId}/stats`),
};

// ─── Lists API ────────────────────────────────────────────────────────────
export const listsAPI = {
  create: (data) => api.post('/lists', data),
  update: (listId, data) => api.patch(`/lists/${listId}`, data),
  delete: (listId) => api.delete(`/lists/${listId}`),
};

// ─── Cards API ────────────────────────────────────────────────────────────
export const cardsAPI = {
  create: (data) => api.post('/cards', data),
  update: (cardId, data) => api.patch(`/cards/${cardId}`, data),
  delete: (cardId) => api.delete(`/cards/${cardId}`),
  move: (cardId, data) => api.patch(`/cards/${cardId}/move`, data),
};

// ─── Files API ────────────────────────────────────────────────────────────
export const filesAPI = {
  upload: (boardId, formData) => api.post(`/boards/${boardId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list: (boardId) => api.get(`/boards/${boardId}/files`),
  download: (fileId) => api.get(`/files/${fileId}/download`, { responseType: 'blob' }),
  delete: (fileId) => api.delete(`/files/${fileId}`),
};

// ─── Whiteboard API ───────────────────────────────────────────────────────
export const whiteboardAPI = {
  get: (boardId) => api.get(`/boards/${boardId}/whiteboard`),
  save: (boardId, canvasData) => api.post(`/boards/${boardId}/whiteboard`, { canvasData }),
};

export default api;
