import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Main authentication hook
export const useAuth = () => {
  return useQuery({
    queryKey: ['auth', 'status'],
    queryFn: api.getAuthStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      // Clear all cached data
      queryClient.clear();
      
      // Refresh the page to reset state
      window.location.reload();
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Still reload
      window.location.reload();
    },
  });
};

// Auth utility functions
export const authUtils = {
  // Handle OAuth callback
  handleOAuthCallback: () => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success) {
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return { success: true };
    } else if (error) {
      console.error('OAuth error:', error);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return { success: false, error };
    }
    
    return { success: false };
  }
}; 