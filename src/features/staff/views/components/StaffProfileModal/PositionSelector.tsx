'use client';

import React, { memo, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { StaffPosition } from '../../../types';
import { PositionSelectorProps } from './types';

export const PositionSelector = memo(function PositionSelector({
  positions,
  selectedPositionId,
  onSelect,
  onCreatePosition,
  onUpdatePosition,
  onDeletePosition,
  isCreating,
  isUpdating,
  isDeleting,
}: PositionSelectorProps) {
  const t = useTranslations();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isEditingPosition, setIsEditingPosition] = useState<string | null>(null);

  // 새 직급 입력 상태
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionNameEn, setNewPositionNameEn] = useState('');
  const [newPositionNameTh, setNewPositionNameTh] = useState('');

  // 수정 직급 입력 상태
  const [editPositionName, setEditPositionName] = useState('');
  const [editPositionNameEn, setEditPositionNameEn] = useState('');
  const [editPositionNameTh, setEditPositionNameTh] = useState('');

  // 삭제 확인 모달 상태
  const [positionToDelete, setPositionToDelete] = useState<StaffPosition | null>(null);

  // 메모이제이션된 값들
  const selectedPosition = useMemo(
    () => positions.find(p => p.id === selectedPositionId),
    [positions, selectedPositionId]
  );

  const filteredPositions = useMemo(
    () => positions.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.name_en && p.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.name_th && p.name_th.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [positions, searchTerm]
  );

  const exactMatch = useMemo(
    () => positions.some(p => p.name.toLowerCase() === searchTerm.toLowerCase()),
    [positions, searchTerm]
  );

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

  // 핸들러 함수들
  const handleSelectPosition = useCallback((position: StaffPosition) => {
    onSelect(position.id);
    setIsCreatingNew(false);
    setShowDropdown(false);
    setSearchTerm('');
  }, [onSelect]);

  const handleCreateNewPosition = useCallback(() => {
    setIsCreatingNew(true);
    setNewPositionName(searchTerm);
    setShowDropdown(false);
  }, [searchTerm]);

  const handleCancelCreate = useCallback(() => {
    setIsCreatingNew(false);
    setNewPositionName('');
    setNewPositionNameEn('');
    setNewPositionNameTh('');
  }, []);

  const handleSaveNewPosition = useCallback(async () => {
    if (!newPositionName.trim()) return;
    try {
      const newPosition = await onCreatePosition({
        name: newPositionName.trim(),
        name_en: newPositionNameEn.trim() || '',
        name_th: newPositionNameTh.trim() || '',
        rank: positions.length + 1,
      });
      onSelect(newPosition?.data?.id || null);
      setIsCreatingNew(false);
      setNewPositionName('');
      setNewPositionNameEn('');
      setNewPositionNameTh('');
    } catch (error) {
      console.error('Failed to create position:', error);
    }
  }, [newPositionName, newPositionNameEn, newPositionNameTh, positions.length, onCreatePosition, onSelect]);

  const handleStartEdit = useCallback((e: React.MouseEvent, position: StaffPosition) => {
    e.stopPropagation();
    setIsEditingPosition(position.id);
    setEditPositionName(position.name);
    setEditPositionNameEn(position.name_en || '');
    setEditPositionNameTh(position.name_th || '');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditingPosition(null);
    setEditPositionName('');
    setEditPositionNameEn('');
    setEditPositionNameTh('');
  }, []);

  const handleSaveEdit = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditingPosition || !editPositionName.trim()) return;

    try {
      await onUpdatePosition({
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
  }, [isEditingPosition, editPositionName, editPositionNameEn, editPositionNameTh, onUpdatePosition]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, position: StaffPosition) => {
    e.stopPropagation();
    setPositionToDelete(position);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!positionToDelete) return;

    try {
      await onDeletePosition(positionToDelete.id);
      if (selectedPositionId === positionToDelete.id) {
        onSelect(null);
      }
      setPositionToDelete(null);
    } catch (error) {
      console.error('Failed to delete position:', error);
    }
  }, [positionToDelete, onDeletePosition, selectedPositionId, onSelect]);

  return (
    <>
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
                  <Input
                    type="text"
                    className="text-sm border-secondary-200"
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
                            className="p-1 text-secondary-400 hover:text-error-500 hover:bg-error-50 rounded"
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
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelCreate}
                className="px-3 py-1.5 text-sm text-secondary-600 hover:text-secondary-800"
              >
                {t('staff.profileModal.position.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveNewPosition}
                disabled={isCreating || !newPositionName.trim()}
                className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
              >
                {isCreating ? t('staff.profileModal.position.saving') : t('staff.profileModal.position.save')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 직급 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!positionToDelete}
        onClose={() => setPositionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t('staff.profileModal.position.deleteTitle')}
        description={t('staff.profileModal.position.deleteDesc', { name: positionToDelete?.name || '' })}
        confirmText={isDeleting ? t('staff.profileModal.position.deleting') : t('staff.profileModal.position.delete')}
        variant="destructive"
      />
    </>
  );
});
