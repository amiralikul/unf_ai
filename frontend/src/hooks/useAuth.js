import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';

/**
 * Comprehensive authentication hook using React Query
 * 
 * This hook provides all authentication functionality:
 * - Authentication state (isAuthenticated, user)
 * - Loading and error states
 * - Login and logout methods
 * - OAuth callback handling
 * 
 * @returns {Object} Authentication state and methods
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Get authentication status
  const { 
    data: authData, 
    isLoading, 
    error: authError,
    refetch: refreshAuthStatus
  } = useQuery({
    queryKey: ['auth', 'status'],
    queryFn: api.getAuthStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  console.log('Auth data:', authData);

  // Extract authentication data
  const isAuthenticated = authData?.isAuthenticated || false;
  const user = authData?.user || null;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: api.getGoogleAuthUrl,
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get authentication URL');
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Navigate to login page
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Still navigate to login page
      navigate('/login', { replace: true });
    },
  });

  /**
   * Handle OAuth callback after successful authentication
   * Refreshes auth status and redirects to the intended destination
   */
  const handleAuthCallback = async () => {
    try {
      // Refresh authentication status
      await refreshAuthStatus();
      
      // Redirect to intended destination or default to home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Error handling auth callback:', error);
      navigate('/login', { replace: true, state: { error: 'Authentication failed. Please try again.' } });
    }
  };

  // Combine errors from auth status and login
  const error = authError || loginMutation.error;

  return {
    // Authentication state
    isAuthenticated,
    isLoading,
    user,
    error: error ? error.message || 'Authentication error' : null,
    
    // Authentication methods
    login: () => loginMutation.mutate(),
    logout: () => logoutMutation.mutate(),
    refreshAuthStatus,
    handleAuthCallback,
    
    // Raw state (for advanced use cases)
    loginMutation,
    logoutMutation,
    authData
  };
};

/**
 * @deprecated Use the main useAuth hook instead
 */
export const useGoogleAuthUrl = () => {
  console.warn('useGoogleAuthUrl is deprecated. Use useAuth().login instead.');
  const { login, loginMutation } = useAuth();
  return {
    ...loginMutation,
    mutate: login
  };
};

/**
 * @deprecated Use the main useAuth hook instead
 */
export const useLogout = () => {
  console.warn('useLogout is deprecated. Use useAuth().logout instead.');
  const { logout, logoutMutation } = useAuth();
  return {
    ...logoutMutation,
    mutate: logout
  };
};

/**
 * @deprecated Use useAuth().handleAuthCallback instead
 */

// Export a function to get auth state from queryClient (for non-component code)
export const getAuthState = () => {
  const queryClient = useQueryClient();
  const authData = queryClient.getQueryData(['auth', 'status']);
  return {
    isAuthenticated: authData?.isAuthenticated || false,
    user: authData?.user || null
  };
};
