import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryClient';

export const useTrelloBoards = () => {
  return useQuery({
    queryKey: queryKeys.trelloBoards,
    queryFn: api.getTrelloBoards,
    staleTime: 3 * 60 * 1000, // 3 minutes for board data
  });
}; 