'use client';

import { memo, useCallback } from 'react';
import { X, Check, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Industry } from '../../types';

interface IndustrySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  industries: Industry[];
  selectedIndustryIds: string[];
  onToggleIndustry: (id: string) => void;
}

// 개별 업종 버튼 컴포넌트 (rerender-memo)
interface IndustryButtonProps {
  industry: Industry;
  isSelected: boolean;
  onToggle: () => void;
}

const IndustryButton = memo(function IndustryButton({
  industry,
  isSelected,
  onToggle,
}: IndustryButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        relative flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200
        ${
          isSelected
            ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
            : 'border-secondary-100 bg-white text-secondary-600 hover:border-secondary-200 hover:bg-secondary-50'
        }
      `}
    >
      <div className="flex flex-col items-center gap-2">
        <span className="font-semibold text-base">{industry.name}</span>
        {isSelected && (
          <div className="absolute top-2 right-2 text-primary-600">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>
    </button>
  );
});

// rendering-hoist-jsx: 정보 패널 호이스팅
function InfoPanel() {
  const t = useTranslations('menu');
  return (
    <div className="bg-primary-50 text-primary-800 text-sm p-4 rounded-md mb-6 flex items-start gap-2">
      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p>
        {t('industryInfo')}
        <br />
        {t('industryInfoSub')}
      </p>
    </div>
  );
}

// rerender-memo: 모달 컴포넌트 메모이제이션
function IndustrySelectionModalComponent({
  isOpen,
  onClose,
  industries,
  selectedIndustryIds,
  onToggleIndustry,
}: IndustrySelectionModalProps) {
  const t = useTranslations();

  // js-early-exit: 조기 반환
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-100">
          <h2 className="text-lg font-bold text-secondary-900">{t('menu.industrySettings')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <InfoPanel />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {industries.map((industry) => {
              const isSelected = selectedIndustryIds.includes(industry.id);
              return (
                <IndustryButton
                  key={industry.id}
                  industry={industry}
                  isSelected={isSelected}
                  onToggle={() => onToggleIndustry(industry.id)}
                />
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-secondary-50 flex justify-end">
          <Button onClick={onClose} className="px-6">
            {t('common.complete')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const IndustrySelectionModal = memo(IndustrySelectionModalComponent);
export default IndustrySelectionModal;
