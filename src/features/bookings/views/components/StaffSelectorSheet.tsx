'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Minus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { ArtistOption } from '../../types';

interface StaffSelectorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  artists: ArtistOption[];
  selectedStaffIds: string[];
  onChangeStaffIds: (ids: string[]) => void;
}

export const StaffSelectorSheet = memo(function StaffSelectorSheet({
  isOpen,
  onClose,
  artists,
  selectedStaffIds,
  onChangeStaffIds,
}: StaffSelectorSheetProps) {
  const t = useTranslations();

  const isAllSelected = selectedStaffIds.length === 0;
  const isPartial = selectedStaffIds.length > 0 && selectedStaffIds.length < artists.length;

  const handleSelectAll = () => {
    // 전체 선택 → 모두 해제(= 전체 표시), 일부/개별 선택 → 전체 해제
    onChangeStaffIds([]);
  };

  const handleToggle = (id: string) => {
    if (selectedStaffIds.includes(id)) {
      const next = selectedStaffIds.filter((s) => s !== id);
      onChangeStaffIds(next);
    } else {
      onChangeStaffIds([...selectedStaffIds, id]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('booking.selectStaff')}
    >
      <div className="space-y-2 pb-2">
        {/* 전체 선택 */}
        <button
          type="button"
          onClick={handleSelectAll}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-colors"
        >
          <span className="text-sm font-medium text-secondary-800">
            {t('common.selectAll')}
          </span>
          <span
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
              isAllSelected || isPartial
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-200 text-secondary-400'
            )}
          >
            {isPartial ? (
              <Minus size={16} strokeWidth={3} />
            ) : (
              <Check size={16} strokeWidth={3} />
            )}
          </span>
        </button>

        {/* 직원 목록 */}
        {artists.map((artist) => {
          const isChecked = selectedStaffIds.includes(artist.value);
          return (
            <button
              key={artist.value}
              type="button"
              onClick={() => handleToggle(artist.value)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-colors"
            >
              <span className="text-sm font-medium text-secondary-800">
                {artist.label}
              </span>
              <span
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
                  isChecked
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-200 text-secondary-400'
                )}
              >
                <Check size={16} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
});
