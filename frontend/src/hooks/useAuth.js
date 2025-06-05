import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Check authentication status
export const useAuthStatus = () => {
  return useQuery({
    queryKey: ['auth', 'status'],
    queryFn: api.getAuthStatus,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: false,
  });
};

// Get current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: api.getCurrentUser,
    enabled: !!localStorage.getItem('authToken'),
    retry: false,
  });
};

// Get Google OAuth URL
export const useGoogleAuthUrl = () => {
  return useMutation({
    mutationFn: api.getGoogleAuthUrl,
    onSuccess: (data) => {
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      console.error('Failed to get Google auth URL:', error);
    },
  });
};

// Logout
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      // Clear auth token
      localStorage.removeItem('authToken');
      
      // Clear all cached data
      queryClient.clear();
      
      // Refresh the page to reset state
      window.location.reload();
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Clear token anyway
      localStorage.removeItem('authToken');
      window.location.reload();
    },
  });
};

// Auth utility functions
export const authUtils = {
  // Set auth token
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },
  
  // Get auth token
  getToken: () => {
    return localStorage.getItem('authToken');
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
  
  // Handle OAuth callback
  handleOAuthCallback: () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (token && success) {
      authUtils.setToken(token);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return { success: true, token };
    } else if (error) {
      console.error('OAuth error:', error);
      return { success: false, error };
    }
    
    return { success: false };
  }
}; 