'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { supabase } from '@/lib/supabase/client';
import { ProfileImageUploaderProps } from './types';

export function ProfileImageUploader({
  profileImage,
  salonId,
  staffId,
  onImageChange,
}: ProfileImageUploaderProps) {
  const t = useTranslations();
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${salonId}/${staffId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      onImageChange(data.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(t('staff.profileModal.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmDelete = () => {
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
  };

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
}
