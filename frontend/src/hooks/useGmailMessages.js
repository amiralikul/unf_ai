import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useUrlPagination } from '@/hooks/useUrlPagination';
import React from 'react';

export const useGmailMessages = (params = {}) => {
  const { isAuthenticated, authData } = useAuth();

  console.log('authData:', authData);
  console.log('isAuthenticated:', isAuthenticated);

  return useQuery({
    queryKey: [...queryKeys.gmailMessages, params],
    queryFn: () => api.getGmailMessages(params),
    staleTime: 1 * 60 * 1000, // 1 minute for email data
    enabled: isAuthenticated, // Only fetch when authenticated
  });
};

export const useGmailMessagesWithPagination = (defaults = { page: 1, limit: 10 }) => {
  const { isAuthenticated } = useAuth();
  const { pagination } = useUrlPagination(defaults);

  const query = useQuery({
    queryKey: [...queryKeys.gmailMessages, pagination],
    queryFn: () => api.getGmailMessages(pagination),
    staleTime: 1 * 60 * 1000,
    enabled: isAuthenticated,
  });

  return {
    ...query,
    pagination: query.data?.pagination || { total: 0, totalPages: 0, page: pagination.page, limit: pagination.limit }
  };
};

export const useGmailMessage = (id) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['gmail', 'message', id],
    queryFn: () => api.getGmailMessage(id),
    staleTime: 5 * 60 * 1000, // 5 minutes for individual message data
    enabled: isAuthenticated && !!id,
  });
};

export const useGmailThreads = (params = {}) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['gmail', 'threads', params],
    queryFn: () => api.getGmailThreads(params),
    staleTime: 2 * 60 * 1000, // 2 minutes for thread data
    enabled: isAuthenticated,
  });
};

export const useUpdateGmailMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateGmailMessage(id, data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch gmail messages
      queryClient.invalidateQueries({ queryKey: queryKeys.gmailMessages });
      // Also invalidate the specific message query
      queryClient.invalidateQueries({ queryKey: ['gmail', 'message', variables.id] });
      // Also invalidate threads as they might be affected
      queryClient.invalidateQueries({ queryKey: ['gmail', 'threads'] });
    },
    onError: (error) => {
      console.error('Failed to update gmail message:', error);
    },
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