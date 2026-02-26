import axios from 'axios';
import { getSession } from './auth';

const getBaseURL = () => {
    const envURL = import.meta.env.VITE_API_URL;
    if (!envURL) return '/api';

    // Ensure it ends with /api but doesn't have double //
    const cleanURL = envURL.replace(/\/$/, '');
    return cleanURL.endsWith('/api') ? cleanURL : `${cleanURL}/api`;
};

const api = axios.create({
    baseURL: getBaseURL(),
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
    delete: (id) => api.delete(`/catalog/${id}`),
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
