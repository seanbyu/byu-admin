'use client';

import React, { memo, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { supabase } from '@/lib/supabase/client';
import { ProfileImageUploaderProps } from './types';

export const ProfileImageUploader = memo(function ProfileImageUploader({
  profileImage,
  salonId,
  staffId,
  onImageChange,
}: ProfileImageUploaderProps) {
  const t = useTranslations();
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // 파일 크기 체크 (5MB 제한)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(t('staff.profileModal.fileTooLarge'));
        return;
      }

      setUploading(true);

      // 세션에서 토큰 가져오기
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('로그인이 필요합니다.');
      }

      // 기존 이미지가 있으면 먼저 삭제
      if (profileImage) {
        const pathParts = profileImage.split('/avatars/');
        if (pathParts.length > 1) {
          const oldPath = decodeURIComponent(pathParts[1]);
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // 새 파일 업로드
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${salonId}/${staffId}/${fileName}`;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/avatars/${filePath}`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-upsert': 'true',
        },
        body: file,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      onImageChange(data.publicUrl);
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(error?.message || t('staff.profileModal.uploadFailed'));
    } finally {
      setUploading(false);
    }
  }, [salonId, staffId, profileImage, onImageChange, t]);

  const handleConfirmDelete = useCallback(() => {
    onImageChange('');
    setShowDeleteConfirm(false);

    if (profileImage) {
      const pathParts = profileImage.split('/avatars/');
      if (pathParts.length > 1) {
        const path = pathParts[1];
        const decodedPath = decodeURIComponent(path);

        supabase.storage
          .from('avatars')
          .remove([decodedPath])
          .catch((err) => {
            console.error('Background storage delete failed:', err);
          });
      }
    }
  }, [profileImage, onImageChange]);

  return (
    <>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary-700">
          {t('staff.profileModal.profileImage')}
        </label>
        <div className="flex items-center space-x-4">
          {profileImage ? (
            <div className="relative group">
              <img
                src={profileImage}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border border-secondary-200"
              />
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="absolute -top-1 -right-1 bg-white rounded-full p-1 border border-secondary-200 shadow-sm text-secondary-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title={t('staff.profileModal.deleteImage')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-secondary-100 flex items-center justify-center border border-secondary-200">
              <Camera className="text-secondary-400" size={24} />
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-sm text-secondary-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading}
            />
            <p className="mt-1 text-xs text-secondary-400">
              {uploading ? t('staff.profileModal.uploading') : t('staff.profileModal.imageHint')}
            </p>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={t('staff.profileModal.deleteImageTitle')}
        description={t('staff.profileModal.deleteImageDesc')}
        confirmText={t('staff.profileModal.deleteConfirm')}
        variant="destructive"
      />
    </>
  );
});
