import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { ApiResponse, PaginationParams, Review } from '@/types';

export const createReviewsApi = () => {
  return {
    getReviews: (params?: PaginationParams): Promise<ApiResponse<Review[]>> =>
      apiClient.get(endpoints.reviews.all.path(), params as any), // cast params to any for now to match the updated client signature which expects specific primitives but let's just make it compatible or update the client to accept object params properly. Wait, client accepts Record<string, string|number..>. PaginationParams should work if we cast or map it. Actually let's just use 'any' cast for params in the call if strictness is too high, but 'Review[]' for return type.

    getReview: (id: string): Promise<ApiResponse<Review>> =>
      apiClient.get(endpoints.reviews.detail.path(id)),

    respondToReview: (id: string, response: string) =>
      apiClient.post(endpoints.reviews.respond.path(id), { response }),
  };
};
