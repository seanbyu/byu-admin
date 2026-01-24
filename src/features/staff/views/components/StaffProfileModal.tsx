'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Staff } from '../../types';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import {
  Camera,
  Trash2,
  Instagram,
  Facebook,
  Youtube,
  Music2,
} from 'lucide-react';

interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff;
  onSave: (staffId: string, updates: Partial<Staff>) => Promise<void>;
}

interface ProfileFormData {
  name: string;
  phone: string;
  description: string;
  experience: number;
  specialties: string; // Comma separated for input
  profileImage: string;
  socialLinks: {
    instagram: string;
    youtube: string;
    tiktok: string;
    facebook: string;
  };
  password?: string;
}

export default function StaffProfileModal({
  isOpen,
  onClose,
  staff,
  onSave,
}: StaffProfileModalProps) {
  const t = useTranslations();
  const [uploading, setUploading] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ProfileFormData>();

  const profileImage = watch('profileImage');

  useEffect(() => {
    if (isOpen && staff) {
      reset({
        name: staff.name,
        phone: staff.phone || '',
        description: staff.description,
        experience: staff.experience,
        specialties: staff.specialties.join(', '),
        profileImage: staff.profileImage || '',
        socialLinks: {
          instagram: staff.socialLinks?.instagram || '',
          youtube: staff.socialLinks?.youtube || '',
          tiktok: staff.socialLinks?.tiktok || '',
          facebook: staff.socialLinks?.facebook || '',
        },
      });
    }
  }, [isOpen, staff, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const specialtiesArray = data.specialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onSave(staff.id, {
        name: data.name,
        password: data.password || undefined,
        phone: data.phone,
        description: data.description,
        experience: Number(data.experience),
        specialties: specialtiesArray,
        profileImage: data.profileImage,
        socialLinks: data.socialLinks,
      } as any);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('프로필 업데이트에 실패했습니다.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      // Use salonId/staffId/timestamp.ext structure
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${staff.salonId}/${staff.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      setValue('profileImage', data.publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    // 1. Optimistic UI Update: Clear image and close modal immediately
    const currentImage = watch('profileImage');
    setValue('profileImage', '', { shouldDirty: true, shouldValidate: true });
    setShowDeleteConfirm(false);

    // 2. Background Storage Deletion
    if (currentImage) {
      const pathParts = currentImage.split('/avatars/');
      if (pathParts.length > 1) {
        const path = pathParts[1];
        const decodedPath = decodeURIComponent(path);

        // Fire and forget
        supabase.storage
          .from('avatars')
          .remove([decodedPath])
          .then(({ error }) => {
            if (error) {
              console.error('Background storage delete error:', error);
            } else {
              console.log('Background storage delete success');
            }
          })
          .catch((err) => {
            console.error('Background storage delete failed:', err);
          });
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${staff.name} ${t('staff.profile') || '프로필 수정'}`}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="이름"
              {...register('name', { required: '이름은 필수입니다.' })}
              error={errors.name?.message}
            />
            <Input
              label="연락처"
              {...register('phone')}
              placeholder="010-0000-0000"
            />
          </div>

          {/* Password Change Section */}
          <div className="space-y-2 border-t border-secondary-200 pt-4 mt-2">
            <label className="block text-sm font-medium text-secondary-700">
              비밀번호 변경 (선택사항)
            </label>
            <Input
              type="password"
              placeholder="새 비밀번호를 입력하세요 (변경하지 않으려면 공란)"
              {...register('password')}
            />
            <p className="text-xs text-secondary-500">
              비밀번호를 입력하면 해당 값으로 변경됩니다.
            </p>
          </div>
          <div className="border-b border-secondary-200 mb-4"></div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              프로필 이미지
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
                    onClick={handleRemoveClick}
                    className="absolute -top-1 -right-1 bg-white rounded-full p-1 border border-secondary-200 shadow-sm text-secondary-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="이미지 삭제"
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
                  {uploading ? '업로드 중...' : 'JPG, PNG, GIF (최대 5MB)'}
                </p>
              </div>
              <input type="hidden" {...register('profileImage')} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label="경력 (년)"
              {...register('experience', { min: 0 })}
            />
            <Input
              label="전문 분야 (쉼표로 구분)"
              {...register('specialties')}
              placeholder="커트, 펌, 염색"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-secondary-700">
              소개
            </label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              {...register('description')}
              placeholder="직원 소개를 입력하세요"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-secondary-200">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              소셜 미디어
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Instagram size={18} className="text-secondary-400" />
                </div>
                <Input
                  className="pl-10"
                  {...register('socialLinks.instagram')}
                  placeholder="Instagram ID or URL"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Youtube size={18} className="text-secondary-400" />
                </div>
                <Input
                  className="pl-10"
                  {...register('socialLinks.youtube')}
                  placeholder="YouTube Channel"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Music2 size={18} className="text-secondary-400" />
                </div>
                <Input
                  className="pl-10"
                  {...register('socialLinks.tiktok')}
                  placeholder="TikTok ID"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Facebook size={18} className="text-secondary-400" />
                </div>
                <Input
                  className="pl-10"
                  {...register('socialLinks.facebook')}
                  placeholder="Facebook URL"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 mt-6">
            <Button variant="outline" type="button" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="프로필 이미지 삭제"
        description="프로필 이미지를 삭제하시겠습니까? 삭제 후 저장하면 복구할 수 없습니다."
        confirmText="삭제"
        variant="destructive"
      />
    </>
  );
}
