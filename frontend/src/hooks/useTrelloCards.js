import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
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