import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export const useAIQuery = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ query, options }) => api.queryAI(query, options),
    onSuccess: (data) => {
      // Optionally cache the result or update query history
      console.log('AI Query successful:', data);
    },
    onError: (error) => {
      console.error('AI Query failed:', error);
    },
  });
};

export const useAIHistory = (params = {}) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['ai', 'history', params],
    queryFn: () => api.getAIHistory(params),
    staleTime: 5 * 60 * 1000, // 5 minutes for history data
    enabled: isAuthenticated,
  });
};

export const useAIStats = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['ai', 'stats'],
    queryFn: api.getAIStats,
    staleTime: 10 * 60 * 1000, // 10 minutes for stats data
    enabled: isAuthenticated,
  });
};

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

export const useLangChainNLToSQL = () => {
  return useMutation({
    mutationFn: (question) => api.queryLangChainNLToSQL(question),
    onSuccess: (data) => {
      console.log('LangChain NL-to-SQL Query successful:', data);
    },
    onError: (error) => {
      console.error('LangChain NL-to-SQL Query failed:', error);
    },
  });
};

export const useCompareNLToSQL = () => {
  return useMutation({
    mutationFn: (question) => api.compareNLToSQL(question),
    onSuccess: (data) => {
      console.log('NL-to-SQL Comparison successful:', data);
    },
    onError: (error) => {
      console.error('NL-to-SQL Comparison failed:', error);
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

export const useLangChainNLToSQLHealth = () => {
  return useQuery({
    queryKey: ['ai', 'langchain', 'nl-to-sql', 'health'],
    queryFn: api.getLangChainNLToSQLHealth,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  });
};
