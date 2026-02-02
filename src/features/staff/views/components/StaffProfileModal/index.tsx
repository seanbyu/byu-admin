'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStaffPositions } from '../../../hooks/useStaffPositions';
import { ProfileImageUploader } from './ProfileImageUploader';
import { PositionSelector } from './PositionSelector';
import { SocialLinksForm } from './SocialLinksForm';
import { StaffProfileModalProps, ProfileFormData } from './types';

export default function StaffProfileModal({
  isOpen,
  onClose,
  staff,
  onSave,
}: StaffProfileModalProps) {
  const t = useTranslations();

  // Position 관련 상태
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionNameEn, setNewPositionNameEn] = useState('');
  const [newPositionNameTh, setNewPositionNameTh] = useState('');

  // 직급 목록 가져오기
  const {
    positions,
    createPosition,
    updatePosition,
    deletePosition,
    isCreating,
    isUpdating,
    isDeleting,
  } = useStaffPositions(staff.salonId, {
    enabled: isOpen && !!staff.salonId,
  });

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
      setSelectedPositionId(staff.positionId || null);
      setIsCreatingNew(false);
      setNewPositionName('');
      setNewPositionNameEn('');
      setNewPositionNameTh('');
    }
  }, [isOpen, staff, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const specialtiesArray = data.specialties
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      let positionIdToSave = selectedPositionId;

      // 새 직급 생성이 필요한 경우
      if (isCreatingNew && newPositionName.trim()) {
        const newPosition = await createPosition({
          name: newPositionName.trim(),
          name_en: newPositionNameEn.trim() || '',
          name_th: newPositionNameTh.trim() || '',
          rank: positions.length + 1,
        });
        positionIdToSave = newPosition?.data?.id || null;
      }

      await onSave(staff.id, {
        name: data.name,
        phone: data.phone,
        positionId: positionIdToSave,
        description: data.description,
        experience: Number(data.experience),
        specialties: specialtiesArray,
        profileImage: data.profileImage,
        socialLinks: data.socialLinks,
      } as any);
      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert(t('staff.profileModal.updateFailed'));
    }
  };

  const handleImageChange = (url: string) => {
    setValue('profileImage', url, { shouldDirty: true, shouldValidate: true });
  };

  const handlePositionSelect = (positionId: string | null) => {
    setSelectedPositionId(positionId);
    setIsCreatingNew(false);
  };

  const handleCreatePosition = async (data: { name: string; name_en: string; name_th: string; rank: number }) => {
    const result = await createPosition(data);
    return result;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${staff.name} ${t('staff.profile')}`}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 이름 & 전화번호 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('staff.profileModal.name')}
            {...register('name', { required: t('staff.profileModal.nameRequired') })}
            error={errors.name?.message}
          />
          <Input
            label={t('staff.profileModal.phone')}
            {...register('phone')}
            placeholder="010-0000-0000"
          />
        </div>

        {/* 프로필 이미지 업로더 */}
        <ProfileImageUploader
          profileImage={profileImage || ''}
          salonId={staff.salonId}
          staffId={staff.id}
          onImageChange={handleImageChange}
        />

        {/* 직급/호칭 선택기 */}
        <PositionSelector
          positions={positions}
          selectedPositionId={selectedPositionId}
          onSelect={handlePositionSelect}
          onCreatePosition={handleCreatePosition}
          onUpdatePosition={updatePosition}
          onDeletePosition={deletePosition}
          isCreating={isCreating}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
        />

        {/* 경력 & 전문분야 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            label={t('staff.profileModal.experienceYears')}
            {...register('experience', { min: 0 })}
          />
          <Input
            label={t('staff.profileModal.specialtiesHint')}
            {...register('specialties')}
            placeholder={t('staff.profileModal.specialtiesPlaceholder')}
          />
        </div>

        {/* 소개 */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-secondary-700">
            {t('staff.profileModal.introduction')}
          </label>
          <textarea
            className="w-full min-h-[100px] px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            {...register('description')}
            placeholder={t('staff.profileModal.introPlaceholder')}
          />
        </div>

        {/* 소셜 미디어 링크 */}
        <SocialLinksForm register={register} />

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 mt-6">
          <Button variant="outline" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting || isCreating}
          >
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
