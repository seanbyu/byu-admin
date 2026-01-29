'use client';

import { useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createUploadApi } from '../api';

const uploadApi = createUploadApi();

export const useUploadImage = () => {
  const mutation = useMutation({
    mutationFn: useCallback(
      (formData: FormData) => uploadApi.uploadImage(formData),
      []
    ),
  });

  const uploadImage = useCallback(
    (formData: FormData) => mutation.mutateAsync(formData),
    [mutation]
  );

  return useMemo(
    () => ({
      uploadImage,
      isUploading: mutation.isPending,
      error: mutation.error,
      data: mutation.data,
    }),
    [uploadImage, mutation.isPending, mutation.error, mutation.data]
  );
};
