import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

export const useDriveFiles = (params = {}) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...queryKeys.driveFiles, params],
    queryFn: () => api.getDriveFiles(params),
    staleTime: 2 * 60 * 1000, // 2 minutes for file data
    enabled: isAuthenticated, // Only fetch when authenticated
  });
};

export const useDriveFile = (id) => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['drive', 'file', id],
    queryFn: () => api.getDriveFile(id),
    staleTime: 5 * 60 * 1000, // 5 minutes for individual file data
    enabled: isAuthenticated && !!id,
  });
};

export const useUpdateDriveFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.updateDriveFile(id, data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch drive files
      queryClient.invalidateQueries({ queryKey: queryKeys.driveFiles });
      // Also invalidate the specific file query
      queryClient.invalidateQueries({ queryKey: ['drive', 'file', variables.id] });
    },
    onError: (error) => {
      console.error('Failed to update drive file:', error);
    },
  });
};

export const useDeleteDriveFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.deleteDriveFile(id),
    onSuccess: (data, id) => {
      // Invalidate and refetch drive files
      queryClient.invalidateQueries({ queryKey: queryKeys.driveFiles });
      // Remove the specific file from cache
      queryClient.removeQueries({ queryKey: ['drive', 'file', id] });
    },
    onError: (error) => {
      console.error('Failed to delete drive file:', error);
    },
  });
};

export const useSyncDriveFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.syncDriveFiles,
    onSuccess: () => {
      // Invalidate all drive files queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.driveFiles });
    },
    onError: (error) => {
      console.error('Failed to sync drive files:', error);
    },
  });
};