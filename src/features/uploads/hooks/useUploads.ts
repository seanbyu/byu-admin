'use client';

import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createUploadApi } from '../api';

const uploadApi = createUploadApi();

export const useUploadImage = () => {
  const mutation = useMutation({
    mutationFn: (formData: FormData) => uploadApi.uploadImage(formData),
  });

  return useMemo(
    () => ({
      uploadImage: mutation.mutateAsync,
      isUploading: mutation.isPending,
      error: mutation.error,
      data: mutation.data,
    }),
    [mutation.mutateAsync, mutation.isPending, mutation.error, mutation.data]
  );
};
