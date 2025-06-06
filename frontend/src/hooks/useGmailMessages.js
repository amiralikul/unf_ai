import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';

export const useGmailMessages = () => {
  const { data: authData } = useAuth();
  const isAuthenticated = authData?.isAuthenticated || false;
  
  return useQuery({
    queryKey: queryKeys.gmailMessages,
    queryFn: api.getGmailMessages,
    staleTime: 1 * 60 * 1000, // 1 minute for email data
    enabled: isAuthenticated, // Only fetch when authenticated
  });
}; 