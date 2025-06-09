import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export const useNLToSQL = () => {
  return useMutation({
    mutationFn: (question) => api.queryNLToSQL(question),
    onSuccess: (data) => {
      console.log('NL-to-SQL Query successful:', data);
    },
    onError: (error) => {
      console.error('NL-to-SQL Query failed:', error);
    },
  });
};

export const useNLToSQLHealth = () => {
  return useQuery({
    queryKey: ['ai', 'nl-to-sql', 'health'],
    queryFn: api.getNLToSQLHealth,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });
};
