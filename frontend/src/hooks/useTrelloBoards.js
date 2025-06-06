import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';

export const useTrelloBoards = () => {
  const { data: authData } = useAuth();
  const isAuthenticated = authData?.isAuthenticated || false;
  
  return useQuery({
    queryKey: queryKeys.trelloBoards,
    queryFn: api.getTrelloBoards,
    staleTime: 3 * 60 * 1000, // 3 minutes for board data
    enabled: isAuthenticated, // Only fetch when authenticated
  });
}; 