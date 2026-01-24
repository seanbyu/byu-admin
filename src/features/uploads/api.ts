import { apiClient } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { ApiResponse } from '@/types';

export const createUploadApi = () => {
  return {
    uploadImage: (formData: FormData): Promise<ApiResponse<any>> =>
      apiClient.post(endpoints.upload.image.path(), formData), // Headers handling might be needed in apiClient or here. Assuming apiClient handles FormData.
  };
};
