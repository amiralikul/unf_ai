import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryClient';

export const useDriveFiles = () => {
  return useQuery({
    queryKey: queryKeys.driveFiles,
    queryFn: api.getDriveFiles,
    staleTime: 2 * 60 * 1000, // 2 minutes for file data
  });
};

export const useUpdateDriveFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => api.updateDriveFile(id, data),
    onSuccess: () => {
      // Invalidate and refetch drive files
      queryClient.invalidateQueries({ queryKey: queryKeys.driveFiles });
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
    onSuccess: () => {
      // Invalidate and refetch drive files
      queryClient.invalidateQueries({ queryKey: queryKeys.driveFiles });
    },
    onError: (error) => {
      console.error('Failed to delete drive file:', error);
    },
  });
}; 