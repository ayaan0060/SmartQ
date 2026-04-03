import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '../../lib/api';
import socketService from '../../lib/socket';
import toast from 'react-hot-toast';

/**
 * useQueue Hook
 * Manages the queue state for a specific hospital and service.
 * Features:
 * - TanStack Query for server state
 * - Real-time updates via WebSockets
 * - Mutations for joining/leaving queue
 */
export const useQueue = (hospitalId, serviceId) => {
  const queryClient = useQueryClient();

  // Fetch queue data
  const { data: queueData, isLoading, error } = useQuery({
    queryKey: ['queue', hospitalId, serviceId],
    queryFn: async () => {
      const res = await api.get(`/tokens/status/${hospitalId}/${serviceId}`);
      // Backend success() wrapper: { success, data: [...] }
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : [];
    },
    enabled: !!hospitalId && !!serviceId,
  });

  // WebSocket Integration
  useEffect(() => {
    if (!hospitalId || !serviceId) return;

    socketService.socket.emit('joinHospital', hospitalId);

    const handleQueueUpdate = (data) => {
      if (data.hospitalId === hospitalId && data.serviceId === serviceId) {
        queryClient.invalidateQueries({ queryKey: ['queue', hospitalId, serviceId] });
      }
    };
    
    socketService.socket.on('queueUpdated', handleQueueUpdate);

    return () => {
      socketService.socket.off('queueUpdated', handleQueueUpdate);
    };
  }, [hospitalId, serviceId, queryClient]);

  // Join Queue Mutation
  const joinQueue = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/tokens/book`, { hospitalId, serviceId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['queue', hospitalId, serviceId]);
      toast.success('Successfully joined the queue!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to join queue');
    },
  });

  return {
    queue: Array.isArray(queueData) ? queueData : [],
    isLoading,
    error,
    joinQueue: joinQueue.mutate,
    isJoining: joinQueue.isPending,
  };
};
