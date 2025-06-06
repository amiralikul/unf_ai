import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';

export const useTrelloBoards = (params = {}) => {
  const { data: authData } = useAuth();
  const isAuthenticated = authData?.isAuthenticated || false;

  return useQuery({
    queryKey: [...queryKeys.trelloBoards, params],
    queryFn: () => api.getTrelloBoards(params),
    staleTime: 3 * 60 * 1000, // 3 minutes for board data
    enabled: isAuthenticated, // Only fetch when authenticated
  });
};

export const useTrelloBoard = (boardId) => {
  const { data: authData } = useAuth();
  const isAuthenticated = authData?.isAuthenticated || false;

  return useQuery({
    queryKey: ['trello', 'board', boardId],
    queryFn: () => api.getTrelloBoard(boardId),
    staleTime: 5 * 60 * 1000, // 5 minutes for individual board data
    enabled: isAuthenticated && !!boardId,
  });
};

export const useSyncTrelloData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.syncTrelloData,
    onSuccess: () => {
      // Invalidate all trello queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.trelloBoards });
      queryClient.invalidateQueries({ queryKey: ['trelloCards'] });
    },
    onError: (error) => {
      console.error('Failed to sync Trello data:', error);
    },
  });
};