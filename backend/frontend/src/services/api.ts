import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: { username: string; password: string; role?: string }) =>
    api.post('/auth/register', userData),
};

export const toolsAPI = {
  getAll: () => api.get('/tools'),
  getById: (id: string) => api.get(`/tools/${id}`),
  create: (toolData: any) => api.post('/tools', toolData),
  update: (id: string, toolData: any) => api.put(`/tools/${id}`, toolData),
  delete: (id: string) => api.delete(`/tools/${id}`),
  startUsage: (id: string, data: any) => api.post(`/tools/${id}/usage`, data),
  endUsage: (id: string, usageId: string) => api.put(`/tools/${id}/usage/${usageId}/end`),
};

export const maintenanceAPI = {
  getAll: (params?: any) => api.get('/maintenance', { params }),
  create: (maintenanceData: any) => api.post('/maintenance', maintenanceData),
  getUpcoming: () => api.get('/maintenance/upcoming'),
  getOverdue: () => api.get('/maintenance/overdue'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getStatusDistribution: () => api.get('/dashboard/tool-status-distribution'),
  getConditionDistribution: () => api.get('/dashboard/tool-condition-distribution'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
  getCriticalTools: () => api.get('/dashboard/critical-tools'),
};

export default api;