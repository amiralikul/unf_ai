import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

export const useTrelloCards = (boardId, params = {}) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['trelloCards', boardId, params],
    queryFn: () => api.getTrelloCards(boardId, params),
    staleTime: 2 * 60 * 1000, // 2 minutes for card data
    enabled: isAuthenticated && !!boardId,
  });
};

export const useTrelloCardsWithPagination = (boardId, params = {}) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['trelloCards', boardId, 'paginated', params],
    queryFn: () => api.getTrelloCards(boardId, {
      page: params.page || 1,
      limit: params.limit || 10,
      search: params.search,
      filter: params.filter,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder
    }),
    staleTime: 2 * 60 * 1000,
    enabled: isAuthenticated && !!boardId,
  });
};

export const useSyncTrelloCards = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.syncTrelloData,
    onSuccess: () => {
      // Invalidate all trello queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['trelloCards'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.trelloBoards });
    },
    onError: (error) => {
      console.error('Failed to sync Trello cards:', error);
    },
  });
};