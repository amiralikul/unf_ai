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
        // Return the data field for successful responses
        return data.data || data;
      } else {
        // Throw error for failed responses
        const error = new Error(data.error || 'API request failed');
        error.code = data.code;
        error.details = data.details;
        throw error;
      }
    }

    // Fallback for legacy responses
    return data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);

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

  // Drive files
  getDriveFiles: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
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
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.query) searchParams.set('query', params.query);
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

    const url = `/api/trello/boards/${boardId}/cards${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get(url);
  },
  syncTrelloData: () => apiClient.post('/api/trello/sync'),

  // AI queries
  queryAI: (query, options = {}) => {
    const payload = {
      query,
      context: options.context || 'all',
      includeFiles: options.includeFiles !== false,
      includeEmails: options.includeEmails !== false,
      includeCards: options.includeCards !== false,
    };
    return apiClient.post('/api/ai/query', payload);
  },
  getAIHistory: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const url = `/api/ai/history${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiClient.get(url);
  },
  getAIStats: () => apiClient.get('/api/ai/stats'),
};

export default apiClient; 