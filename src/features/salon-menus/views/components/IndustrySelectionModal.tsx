'use client';

import { memo } from 'react';
import { Check, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('menu.industrySettings')}
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose} className="px-6">
            {t('common.complete')}
          </Button>
        </div>
      }
    >
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
    </Modal>
  );
}

export const IndustrySelectionModal = memo(IndustrySelectionModalComponent);
export default IndustrySelectionModal;
