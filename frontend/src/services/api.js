import axios from 'axios';
import { getSession } from './auth';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(async (config) => {
    try {
        const session = await getSession();
        const token = session.getIdToken().getJwtToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (err) {
        // Not logged in or session expired - continue without token
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const catalogApi = {
    list: (params) => api.get('/catalog', { params }),
    get: (id) => api.get(`/catalog/${id}`),
    create: (data) => api.post('/catalog', data),
    search: (q) => api.get('/search', { params: { q } }),
    suggest: (q) => api.get('/search/suggest', { params: { q } }),
};

export const uploadApi = {
    getPresignedUrl: (type, filename, contentType) =>
        api.post(`/upload/${type}`, { filename, contentType }),
};

export const streamingApi = {
    getStreamUrl: (type, key) => api.get(`/stream/${type}/${key}`),
};

export default api;
