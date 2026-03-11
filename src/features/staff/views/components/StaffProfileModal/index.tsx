'use client';

import React, { memo, useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useStaffPositions } from '../../../hooks/useStaffPositions';
import { ProfileImageUploader } from './ProfileImageUploader';
import { PositionSelector } from './PositionSelector';
import { SocialLinksForm } from './SocialLinksForm';
import { StaffProfileModalProps, ProfileFormData, SocialLinksData } from './types';

function StaffProfileModal({
  isOpen,
  onClose,
  staff,
  onSave,
}: StaffProfileModalProps) {
  const t = useTranslations();

  // Position 선택 상태
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);

  // Social Links 상태 (controlled component)
  const [socialLinks, setSocialLinks] = useState<SocialLinksData>({
    instagram: '',
    youtube: '',
    tiktok: '',
    facebook: '',
  });

  // 직급 목록 가져오기 (TanStack Query)
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
    formState: { errors },
  } = useForm<ProfileFormData>();

  const profileImage = watch('profileImage');

  // 모달 열릴 때 폼 초기화
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
      // Social Links 상태 초기화
      setSocialLinks({
        instagram: staff.socialLinks?.instagram || '',
        youtube: staff.socialLinks?.youtube || '',
        tiktok: staff.socialLinks?.tiktok || '',
        facebook: staff.socialLinks?.facebook || '',
      });
      setSelectedPositionId(staff.positionId || null);
    }
  }, [isOpen, staff, reset]);

  const [isSaving, setIsSaving] = useState(false);

  // 폼 제출 핸들러 — API 완료 후 모달 닫기
  const onSubmit = useCallback(async (data: ProfileFormData) => {
    const specialtiesArray = data.specialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      await onSave(staff.id, {
        name: data.name,
        phone: data.phone,
        positionId: selectedPositionId,
        description: data.description,
        experience: Number(data.experience),
        specialties: specialtiesArray,
        profileImage: data.profileImage,
        socialLinks: socialLinks,
      });
      onClose();
    } catch {
      // 에러 toast는 useStaffActions에서 처리
    } finally {
      setIsSaving(false);
    }
  }, [staff.id, selectedPositionId, socialLinks, onSave, onClose]);

  // 이미지 변경 핸들러
  const handleImageChange = useCallback((url: string) => {
    setValue('profileImage', url, { shouldDirty: true, shouldValidate: true });
  }, [setValue]);

  // 직급 선택 핸들러
  const handlePositionSelect = useCallback((positionId: string | null) => {
    setSelectedPositionId(positionId);
  }, []);

  // Social Links 변경 핸들러
  const handleSocialLinkChange = useCallback((field: keyof SocialLinksData, value: string) => {
    setSocialLinks(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${staff.name} ${t('staff.profile')}`}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 이름 */}
        <Input
          label={t('staff.profileModal.name')}
          {...register('name', { required: t('staff.profileModal.nameRequired') })}
          error={errors.name?.message}
          helperText={t('staff.profileModal.nameHint')}
        />

        {/* 연락처 (읽기 전용) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-secondary-700">
              {t('staff.profileModal.phone')}
            </label>
            <Link
              href="/settings/account"
              className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
              onClick={onClose}
            >
              {t('staff.profileModal.goToSettings')}
            </Link>
          </div>
          <div className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-lg bg-secondary-50 text-secondary-600">
            {staff.phone || '-'}
          </div>
          <p className="text-xs text-secondary-500">
            {t('staff.profileModal.phoneHint')}
          </p>
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
          onCreatePosition={createPosition}
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
          <Textarea
            className="min-h-[100px]"
            {...register('description')}
            placeholder={t('staff.profileModal.introPlaceholder')}
          />
        </div>

        {/* 소셜 미디어 링크 */}
        <SocialLinksForm
          values={socialLinks}
          onChange={handleSocialLinkChange}
        />

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200 mt-6">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSaving || isCreating}
          >
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default memo(StaffProfileModal);
