import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';

export const useGmailMessages = (params = {}) => {
  const { data: authData } = useAuth();
  const isAuthenticated = authData?.isAuthenticated || false;

  return useQuery({
    queryKey: [...queryKeys.gmailMessages, params],
    queryFn: () => api.getGmailMessages(params),
    staleTime: 1 * 60 * 1000, // 1 minute for email data
    enabled: isAuthenticated, // Only fetch when authenticated
  });
};

export const useGmailMessage = (id) => {
  const { data: authData } = useAuth();
  const isAuthenticated = authData?.isAuthenticated || false;

  return useQuery({
    queryKey: ['gmail', 'message', id],
    queryFn: () => api.getGmailMessage(id),
    staleTime: 5 * 60 * 1000, // 5 minutes for individual message data
    enabled: isAuthenticated && !!id,
  });
};

export const useGmailThreads = (params = {}) => {
  const { data: authData } = useAuth();
  const isAuthenticated = authData?.isAuthenticated || false;

  return useQuery({
    queryKey: ['gmail', 'threads', params],
    queryFn: () => api.getGmailThreads(params),
    staleTime: 2 * 60 * 1000, // 2 minutes for thread data
    enabled: isAuthenticated,
  });
};

export const useDeleteGmailMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteGmailMessage(id),
    onSuccess: (data, id) => {
      // Invalidate and refetch gmail messages
      queryClient.invalidateQueries({ queryKey: queryKeys.gmailMessages });
      // Remove the specific message from cache
      queryClient.removeQueries({ queryKey: ['gmail', 'message', id] });
      // Also invalidate threads as they might be affected
      queryClient.invalidateQueries({ queryKey: ['gmail', 'threads'] });
    },
    onError: (error) => {
      console.error('Failed to delete gmail message:', error);
    },
  });
};

export const useSyncGmailMessages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.syncGmailMessages,
    onSuccess: () => {
      // Invalidate all gmail queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.gmailMessages });
      queryClient.invalidateQueries({ queryKey: ['gmail', 'threads'] });
    },
    onError: (error) => {
      console.error('Failed to sync gmail messages:', error);
    },
  });
};