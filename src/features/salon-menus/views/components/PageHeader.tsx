'use client';

import { memo } from 'react';
import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

interface PageHeaderProps {
  onSettingsClick: () => void;
  isSettingsActive?: boolean;
}

// rerender-memo: 헤더 컴포넌트 메모이제이션
export const PageHeader = memo(function PageHeader({
  onSettingsClick,
  isSettingsActive,
}: PageHeaderProps) {
  const t = useTranslations('menu');

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      <Button
        variant="outline"
        size="sm"
        onClick={onSettingsClick}
      >
        <Settings className="w-4 h-4 mr-2" />
        {t('orderSettings')}
      </Button>
    </div>
  );
});

export default PageHeader;
