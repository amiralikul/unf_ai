import axios from 'axios';
import { toCamelCase } from './utils';

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
    // No need to add Authorization header - we use HTTP-only cookies
    // The sessionId cookie is automatically sent with withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Handle new standardized response format
    const data = response.data;

    // If response has success field, it's our new format
    if (typeof data === 'object' && data !== null && 'success' in data) {
      if (data.success) {
        // Return both data and meta for successful responses
        const result = toCamelCase(data.data || data);
        // If there's pagination metadata, include it in the result
        if (data.meta && Object.keys(data.meta).length > 0) {
          return {
            ...result,
            pagination: data.meta
          };
        }
        return result;
      } else {
        // Throw error for failed responses
        const error = new Error(data.error || 'API request failed');
        error.code = data.code;
        error.details = data.details;
        throw error;
      }
    }

    // Fallback for legacy responses
    return toCamelCase(data);
  },
  async (error) => {
    console.error('API Error:', error.response?.data || error.message);

    // Handle authentication errors (401 Unauthorized)
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true; // Mark to prevent infinite retry loops
      
      try {
        // Try to refresh authentication status
        // This will check if the session is still valid on the server
        const authResponse = await apiClient.get('/auth/status');
        
        // If we're still authenticated, retry the original request
        if (authResponse.isAuthenticated) {
          return apiClient(error.config);
        } else {
          // If we're not authenticated, redirect to login
          console.log('Session expired, redirecting to login');
          window.location.href = '/login';
          return Promise.reject(new Error('Authentication required. Please log in.'));
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        console.log('Failed to refresh authentication, redirecting to login');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle standardized error responses
    const errorData = error.response?.data;
    if (errorData && typeof errorData === 'object' && 'success' in errorData) {
      const apiError = new Error(errorData.error || 'API request failed');
      apiError.code = errorData.code;
      apiError.details = errorData.details;
      return Promise.reject(apiError);
    }

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
  updateTrelloCredentials: (credentials) => apiClient.post('/auth/trello-credentials', credentials),

  // Drive files
  getDriveFiles: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.mimeType) searchParams.set('mimeType', params.mimeType);
    if (params.modifiedAfter) searchParams.set('modifiedAfter', params.modifiedAfter);
    if (params.modifiedBefore) searchParams.set('modifiedBefore', params.modifiedBefore);

    const url = `/api/drive/files${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get(url);
  },
  getDriveFile: (id) => apiClient.get(`/api/drive/files/${id}`),
  updateDriveFile: (id, data) => apiClient.patch(`/api/drive/files/${id}`, data),
  deleteDriveFile: (id) => apiClient.delete(`/api/drive/files/${id}`),
  syncDriveFiles: () => apiClient.post('/api/drive/sync'),

  // Gmail messages
  getGmailMessages: (params = {}) => {

    console.log('getGmailMessages params:', params);
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.labelIds) searchParams.set('labelIds', JSON.stringify(params.labelIds));
    if (params.includeSpamTrash) searchParams.set('includeSpamTrash', params.includeSpamTrash.toString());

    const url = `/api/gmail/messages${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get(url);
  },
  getGmailMessage: (id) => apiClient.get(`/api/gmail/messages/${id}`),
  deleteGmailMessage: (id) => apiClient.delete(`/api/gmail/messages/${id}`),
  getGmailThreads: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const url = `/api/gmail/threads${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get(url);
  },
  syncGmailMessages: () => apiClient.post('/api/gmail/sync'),

  // Trello boards
  getTrelloBoards: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.filter) searchParams.set('filter', params.filter);

    const url = `/api/trello/boards${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get(url);
  },
  getTrelloBoard: (boardId) => apiClient.get(`/api/trello/boards/${boardId}`),
  getTrelloCards: (boardId, params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.filter) searchParams.set('filter', params.filter);
    if (params.search) searchParams.set('search', params.search);

    const url = `/api/trello/boards/${boardId}/cards${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get(url);
  },
  syncTrelloData: () => apiClient.post('/api/trello/sync'),

  // AI queries
  
  // NL to SQL queries (powered by LangChain)
  queryNLToSQL: (question) => {
    return apiClient.post('/api/ai/nl-to-sql', { question });
  },
  getNLToSQLHealth: () => apiClient.get('/api/ai/nl-to-sql/health'),
};

export default apiClient;
