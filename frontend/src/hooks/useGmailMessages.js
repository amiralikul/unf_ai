import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryClient';

export const useGmailMessages = () => {
  return useQuery({
    queryKey: queryKeys.gmailMessages,
    queryFn: api.getGmailMessages,
    staleTime: 1 * 60 * 1000, // 1 minute for email data
  });
}; 