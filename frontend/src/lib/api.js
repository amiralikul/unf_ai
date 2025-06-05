import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for session handling
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

// API methods
export const api = {
  // Health check
  health: () => apiClient.get('/health'),
  
  // Authentication
  getGoogleAuthUrl: () => apiClient.get('/auth/google'),
  getAuthStatus: () => apiClient.get('/auth/status'),
  getCurrentUser: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  
  // Drive files
  getDriveFiles: () => apiClient.get('/api/drive/files'),
  updateDriveFile: (id, data) => apiClient.patch(`/api/drive/files/${id}`, data),
  deleteDriveFile: (id) => apiClient.delete(`/api/drive/files/${id}`),
  
  // Gmail messages
  getGmailMessages: () => apiClient.get('/api/gmail/messages'),
  
  // Trello boards
  getTrelloBoards: () => apiClient.get('/api/trello/boards'),
  
  // AI queries
  queryAI: (question) => apiClient.post('/api/ai/query', { question }),
};

export default apiClient; 