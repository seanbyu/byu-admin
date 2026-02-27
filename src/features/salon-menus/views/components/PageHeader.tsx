'use client';

import { memo } from 'react';
import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

interface PageHeaderProps {
  onSettingsClick?: () => void;
  isSettingsActive?: boolean;
}

// rerender-memo: 헤더 컴포넌트 메모이제이션
export const PageHeader = memo(function PageHeader({
  onSettingsClick,
  isSettingsActive,
}: PageHeaderProps) {
  const t = useTranslations('menu');

  return (
    <div className="mb-3 md:mb-5 xl:mb-6 flex flex-col gap-2 md:gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-secondary-900">{t('title')}</h1>
      {onSettingsClick && (
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto h-10 md:h-9"
          onClick={onSettingsClick}
        >
          <Settings className="w-4 h-4 mr-2" />
          {t('orderSettings')}
        </Button>
      )}
    </div>
  );
});

export default PageHeader;
