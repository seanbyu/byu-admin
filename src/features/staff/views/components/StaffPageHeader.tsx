'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface StaffPageHeaderProps {
  isAdmin: boolean;
  onInviteClick: () => void;
}

// rendering-hoist-jsx: 가이드 메시지 키 호이스팅
const GUIDE_MESSAGE_KEYS = ['guide.line1', 'guide.line2', 'guide.line3'] as const;

// rerender-memo: 페이지 헤더 컴포넌트 메모이제이션
export const StaffPageHeader = memo(function StaffPageHeader({
  isAdmin,
  onInviteClick,
}: StaffPageHeaderProps) {
  const t = useTranslations('staff');

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-secondary-900">
          {t('title')}
        </h1>
        <div className="text-sm text-secondary-600 mt-2 space-y-1">
          {GUIDE_MESSAGE_KEYS.map((key) => (
            <p key={key}>• {t(key)}</p>
          ))}
        </div>
      </div>
      {isAdmin && (
        <Button variant="outline" onClick={onInviteClick}>
          {t('register')}
        </Button>
      )}
    </div>
  );
});

export default StaffPageHeader;
