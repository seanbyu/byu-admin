'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Staff, StaffPosition } from '../../types';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase/client';
import {
  Camera,
  Trash2,
  Instagram,
  Facebook,
  Youtube,
  Music2,
  ChevronDown,
  Plus,
  X,
  Pencil,
} from 'lucide-react';
import { useStaffPositions } from '../../hooks/useStaffPositions';

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
  specialties: string;
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
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Position 관련 상태
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isEditingPosition, setIsEditingPosition] = useState<string | null>(null);
  const [editPositionName, setEditPositionName] = useState('');
  const [editPositionNameEn, setEditPositionNameEn] = useState('');
  const [editPositionNameTh, setEditPositionNameTh] = useState('');
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionNameEn, setNewPositionNameEn] = useState('');
  const [newPositionNameTh, setNewPositionNameTh] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionToDelete, setPositionToDelete] = useState<StaffPosition | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 직급 목록 가져오기
  const {
    positions,
    isLoading: positionsLoading,
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

  // 선택된 직급 정보
  const selectedPosition = positions.find(p => p.id === selectedPositionId);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setIsEditingPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 필터된 직급 목록
  const filteredPositions = positions.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.name_en && p.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.name_th && p.name_th.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 검색어가 기존 직급과 정확히 일치하는지 확인
  const exactMatch = positions.some(p => p.name.toLowerCase() === searchTerm.toLowerCase());

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
      setIsEditingPosition(null);
      setNewPositionName('');
      setNewPositionNameEn('');
      setNewPositionNameTh('');
      setSearchTerm('');
    }
  }, [isOpen, staff, reset]);

  const handleSelectPosition = (position: StaffPosition) => {
    setSelectedPositionId(position.id);
    setIsCreatingNew(false);
    setShowDropdown(false);
    setSearchTerm('');
  };

  const handleCreateNewPosition = () => {
    setIsCreatingNew(true);
    setSelectedPositionId(null);
    setNewPositionName(searchTerm);
    setShowDropdown(false);
  };

  const handleCancelCreate = () => {
    setIsCreatingNew(false);
    setNewPositionName('');
    setNewPositionNameEn('');
    setNewPositionNameTh('');
  };

  const handleStartEdit = (e: React.MouseEvent, position: StaffPosition) => {
    e.stopPropagation();
    setIsEditingPosition(position.id);
    setEditPositionName(position.name);
    setEditPositionNameEn(position.name_en || '');
    setEditPositionNameTh(position.name_th || '');
  };

  const handleCancelEdit = () => {
    setIsEditingPosition(null);
    setEditPositionName('');
    setEditPositionNameEn('');
    setEditPositionNameTh('');
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditingPosition || !editPositionName.trim()) return;

    try {
      await updatePosition({
        positionId: isEditingPosition,
        dto: {
          name: editPositionName.trim(),
          name_en: editPositionNameEn.trim() || '',
          name_th: editPositionNameTh.trim() || '',
        },
      });
      setIsEditingPosition(null);
    } catch (error) {
      console.error('Failed to update position:', error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, position: StaffPosition) => {
    e.stopPropagation();
    setPositionToDelete(position);
  };

  const handleConfirmDeletePosition = async () => {
    if (!positionToDelete) return;

    try {
      await deletePosition(positionToDelete.id);
      if (selectedPositionId === positionToDelete.id) {
        setSelectedPositionId(null);
      }
      setPositionToDelete(null);
    } catch (error) {
      console.error('Failed to delete position:', error);
    }
  };

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
        password: data.password || undefined,
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);

      const fileExt = file.name.split('.').pop();
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
      alert(t('staff.profileModal.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    const currentImage = watch('profileImage');
    setValue('profileImage', '', { shouldDirty: true, shouldValidate: true });
    setShowDeleteConfirm(false);

    if (currentImage) {
      const pathParts = currentImage.split('/avatars/');
      if (pathParts.length > 1) {
        const path = pathParts[1];
        const decodedPath = decodeURIComponent(path);

        supabase.storage
          .from('avatars')
          .remove([decodedPath])
          .then(({ error }) => {
            if (error) {
              console.error('Background storage delete error:', error);
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
        title={`${staff.name} ${t('staff.profile')}`}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          {/* Password Change Section */}
          <div className="space-y-2 border-t border-secondary-200 pt-4 mt-2">
            <label className="block text-sm font-medium text-secondary-700">
              {t('staff.profileModal.passwordChange')}
            </label>
            <Input
              type="password"
              placeholder={t('staff.profileModal.passwordPlaceholder')}
              {...register('password')}
            />
            <p className="text-xs text-secondary-500">
              {t('staff.profileModal.passwordHint')}
            </p>
          </div>
          <div className="border-b border-secondary-200 mb-4"></div>

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
                    onClick={handleRemoveClick}
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
              <input type="hidden" {...register('profileImage')} />
            </div>
          </div>

          {/* 직급/호칭 Creatable Combobox */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              {t('staff.profileModal.positionTitle')}
            </label>

            {!isCreatingNew ? (
              <div className="relative" ref={dropdownRef}>
                <div
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md bg-white cursor-pointer flex items-center justify-between"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span className={selectedPosition ? 'text-secondary-900' : 'text-secondary-400'}>
                    {selectedPosition
                      ? `${selectedPosition.name}${selectedPosition.name_en ? ` / ${selectedPosition.name_en}` : ''}${selectedPosition.name_th ? ` / ${selectedPosition.name_th}` : ''}`
                      : t('staff.profileModal.positionTitlePlaceholder')
                    }
                  </span>
                  <ChevronDown size={18} className="text-secondary-400" />
                </div>

                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-md shadow-lg max-h-80 overflow-auto">
                    {/* 검색 입력 */}
                    <div className="p-2 border-b border-secondary-100 sticky top-0 bg-white">
                      <input
                        type="text"
                        className="w-full px-3 py-2 text-sm border border-secondary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder={t('staff.profileModal.position.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* 기존 직급 목록 */}
                    {filteredPositions.map((position) => (
                      <div key={position.id}>
                        {isEditingPosition === position.id ? (
                          /* 수정 모드 */
                          <div
                            className="p-3 border-b border-secondary-100 bg-primary-50/50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-2">
                              <Input
                                placeholder={t('staff.profileModal.position.positionNameKo')}
                                value={editPositionName}
                                onChange={(e) => setEditPositionName(e.target.value)}
                                className="text-sm"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder={t('staff.profileModal.position.positionNameEn')}
                                  value={editPositionNameEn}
                                  onChange={(e) => setEditPositionNameEn(e.target.value)}
                                  className="text-sm"
                                />
                                <Input
                                  placeholder={t('staff.profileModal.position.positionNameTh')}
                                  value={editPositionNameTh}
                                  onChange={(e) => setEditPositionNameTh(e.target.value)}
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1 text-xs text-secondary-600 hover:text-secondary-800"
                                >
                                  {t('staff.profileModal.position.cancel')}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveEdit}
                                  disabled={isUpdating || !editPositionName.trim()}
                                  className="px-3 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
                                >
                                  {isUpdating ? t('staff.profileModal.position.saving') : t('staff.profileModal.position.save')}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* 일반 모드 */
                          <div
                            className={`px-3 py-2 cursor-pointer hover:bg-secondary-50 flex items-center justify-between group ${
                              selectedPositionId === position.id ? 'bg-primary-50 text-primary-700' : ''
                            }`}
                            onClick={() => handleSelectPosition(position)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{position.name}</div>
                              {(position.name_en || position.name_th) && (
                                <div className="text-xs text-secondary-500 truncate">
                                  {position.name_en && <span>EN: {position.name_en}</span>}
                                  {position.name_en && position.name_th && <span> · </span>}
                                  {position.name_th && <span>TH: {position.name_th}</span>}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => handleStartEdit(e, position)}
                                className="p-1 text-secondary-400 hover:text-primary-500 hover:bg-primary-50 rounded"
                                title={t('staff.profileModal.position.edit')}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(e, position)}
                                className="p-1 text-secondary-400 hover:text-red-500 hover:bg-red-50 rounded"
                                title={t('staff.profileModal.position.delete')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* 새 직급 추가 옵션 */}
                    {searchTerm && !exactMatch && (
                      <div
                        className="px-3 py-2 cursor-pointer hover:bg-primary-50 text-primary-600 border-t border-secondary-100 flex items-center gap-2"
                        onClick={handleCreateNewPosition}
                      >
                        <Plus size={16} />
                        <span>"{searchTerm}" {t('staff.profileModal.position.addNew')}</span>
                      </div>
                    )}

                    {/* 직급이 없을 때 */}
                    {filteredPositions.length === 0 && !searchTerm && (
                      <div className="px-3 py-4 text-center text-secondary-400 text-sm">
                        {t('staff.profileModal.position.noPositions')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* 새 직급 생성 폼 */
              <div className="space-y-3 p-3 border border-primary-200 rounded-md bg-primary-50/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary-700">{t('staff.profileModal.position.newPosition')}</span>
                  <button
                    type="button"
                    onClick={handleCancelCreate}
                    className="text-secondary-400 hover:text-secondary-600"
                  >
                    <X size={18} />
                  </button>
                </div>
                <Input
                  placeholder={t('staff.profileModal.position.positionNameKo')}
                  value={newPositionName}
                  onChange={(e) => setNewPositionName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder={t('staff.profileModal.position.positionNameEn')}
                    value={newPositionNameEn}
                    onChange={(e) => setNewPositionNameEn(e.target.value)}
                  />
                  <Input
                    placeholder={t('staff.profileModal.position.positionNameTh')}
                    value={newPositionNameTh}
                    onChange={(e) => setNewPositionNameTh(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

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

          <div className="space-y-4 pt-4 border-t border-secondary-200">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {t('staff.profileModal.socialMedia')}
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

      {/* 프로필 이미지 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={t('staff.profileModal.deleteImageTitle')}
        description={t('staff.profileModal.deleteImageDesc')}
        confirmText={t('staff.profileModal.deleteConfirm')}
        variant="destructive"
      />

      {/* 직급 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!positionToDelete}
        onClose={() => setPositionToDelete(null)}
        onConfirm={handleConfirmDeletePosition}
        title={t('staff.profileModal.position.deleteTitle')}
        description={t('staff.profileModal.position.deleteDesc', { name: positionToDelete?.name || '' })}
        confirmText={isDeleting ? t('staff.profileModal.position.deleting') : t('staff.profileModal.position.delete')}
        variant="destructive"
      />
    </>
  );
}
