import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from './useAuth';

export const useAIQuery = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ query, options }) => api.queryAI(query, options),
    onSuccess: (data) => {
      // Optionally cache the result or update query history
      console.log('AI Query successful:', data);
    },
    onError: (error) => {
      console.error('AI Query failed:', error);
    },
  });
};

export const useAIHistory = (params = {}) => {
  const { data: authData } = useAuth();
  const isAuthenticated = authData?.isAuthenticated || false;
  
  return useQuery({
    queryKey: ['ai', 'history', params],
    queryFn: () => api.getAIHistory(params),
    staleTime: 5 * 60 * 1000, // 5 minutes for history data
    enabled: isAuthenticated,
  });
};

export const useAIStats = () => {
  const { data: authData } = useAuth();
  const isAuthenticated = authData?.isAuthenticated || false;
  
  return useQuery({
    queryKey: ['ai', 'stats'],
    queryFn: api.getAIStats,
    staleTime: 10 * 60 * 1000, // 10 minutes for stats data
    enabled: isAuthenticated,
  });
};
