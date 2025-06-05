import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useTrelloCards = (boardId) => {
  return useQuery({
    queryKey: ['trelloCards', boardId],
    queryFn: async () => {
      const data = await api.getTrelloCards(boardId);
      return data.cards;
    },
    enabled: !!boardId,
  });
};