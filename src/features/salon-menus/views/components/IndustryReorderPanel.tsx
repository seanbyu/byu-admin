'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { SalonIndustry } from '../../types';

interface IndustryReorderPanelProps {
  selectedIndustries: SalonIndustry[];
  onReorder: (direction: 'up' | 'down', index: number) => void;
}

// 개별 업종 행 컴포넌트 (rerender-memo)
interface IndustryRowProps {
  industry: SalonIndustry;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  moveUpLabel: string;
  moveDownLabel: string;
}

const IndustryRow = memo(function IndustryRow({
  industry,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  moveUpLabel,
  moveDownLabel,
}: IndustryRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg border border-secondary-100">
      <div className="flex items-center gap-3">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-xs font-bold text-secondary-500 border border-secondary-200">
          {index + 1}
        </span>
        <span className="font-medium text-secondary-700">{industry.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-1.5 rounded-md hover:bg-white text-secondary-600 disabled:opacity-30"
          aria-label={moveUpLabel}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="p-1.5 rounded-md hover:bg-white text-secondary-600 disabled:opacity-30"
          aria-label={moveDownLabel}
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

// rerender-memo: 패널 컴포넌트 메모이제이션
export const IndustryReorderPanel = memo(function IndustryReorderPanel({
  selectedIndustries,
  onReorder,
}: IndustryReorderPanelProps) {
  const t = useTranslations('menu');

  // js-early-exit: 빈 배열일 때 조기 반환
  if (selectedIndustries.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 mb-8">
      <h3 className="text-sm font-semibold text-secondary-900 mb-4">
        {t('industryOrder')}
      </h3>
      <div className="flex flex-col gap-2 max-w-lg">
        {selectedIndustries.map((industry, index) => (
          <IndustryRow
            key={industry.id}
            industry={industry}
            index={index}
            isFirst={index === 0}
            isLast={index === selectedIndustries.length - 1}
            onMoveUp={() => onReorder('up', index)}
            onMoveDown={() => onReorder('down', index)}
            moveUpLabel={t('reorder.moveUp')}
            moveDownLabel={t('reorder.moveDown')}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-secondary-500">
        * {t('industryOrderHint')}
      </p>
    </div>
  );
});

export default IndustryReorderPanel;
