import { useMutation } from '@tanstack/react-query';
import { createUploadApi } from '../api';

const uploadApi = createUploadApi();

export const useUploadImage = () => {
  return useMutation({
    mutationFn: (formData: FormData) => uploadApi.uploadImage(formData),
  });
};
