import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createReviewsApi } from '../api';

const reviewsApi = createReviewsApi();

export const useReviews = (params?: any, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: async () => {
      const response = await reviewsApi.getReviews(params);
      return response.data;
    },
    ...options,
  });
};

export const useReview = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const response = await reviewsApi.getReview(id);
      return response.data;
    },
    enabled: !!id && options?.enabled,
  });
};

export const useRespondToReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      reviewsApi.respondToReview(id, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
};
