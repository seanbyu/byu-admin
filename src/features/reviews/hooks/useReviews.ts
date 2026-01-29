'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createReviewsApi } from '../api';
import { reviewKeys, REVIEWS_QUERY_OPTIONS } from './queries';

const reviewsApi = createReviewsApi();

export const useReviews = (params?: any, options?: { enabled?: boolean }) => {
  const queryKey = useMemo(() => reviewKeys.list(params), [params]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await reviewsApi.getReviews(params);
      return response.data;
    },
    enabled: options?.enabled !== false,
    ...REVIEWS_QUERY_OPTIONS,
  });

  const reviews = useMemo(() => query.data || [], [query.data]);

  return useMemo(
    () => ({
      data: query.data,
      reviews,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, reviews, query.isLoading, query.isFetching, query.error, query.refetch]
  );
};

export const useReview = (id: string, options?: { enabled?: boolean }) => {
  const queryKey = useMemo(() => reviewKeys.detail(id), [id]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await reviewsApi.getReview(id);
      return response.data;
    },
    enabled: !!id && options?.enabled !== false,
    ...REVIEWS_QUERY_OPTIONS,
  });

  return useMemo(
    () => ({
      data: query.data,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      error: query.error,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.isFetching, query.error, query.refetch]
  );
};

export const useRespondToReview = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: useCallback(
      ({ id, response }: { id: string; response: string }) =>
        reviewsApi.respondToReview(id, response),
      []
    ),
    onSuccess: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    }, [queryClient]),
  });

  const respondToReview = useCallback(
    (params: { id: string; response: string }) => mutation.mutateAsync(params),
    [mutation]
  );

  return useMemo(
    () => ({
      respondToReview,
      isResponding: mutation.isPending,
    }),
    [respondToReview, mutation.isPending]
  );
};
