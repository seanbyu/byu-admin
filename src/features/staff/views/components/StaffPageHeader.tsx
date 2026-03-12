'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface StaffPageHeaderProps {
  isAdmin: boolean;
  onInviteClick: () => void;
  /** 직원 등록 권한 */
  canAddStaff?: boolean;
}

// rendering-hoist-jsx: 가이드 메시지 키 호이스팅
const GUIDE_MESSAGE_KEYS = ['guide.line1', 'guide.line2', 'guide.line3'] as const;

// rerender-memo: 페이지 헤더 컴포넌트 메모이제이션
export const StaffPageHeader = memo(function StaffPageHeader({
  isAdmin,
  onInviteClick,
  canAddStaff,
}: StaffPageHeaderProps) {
  const t = useTranslations('staff');

  // canAddStaff가 명시되지 않으면 isAdmin 사용 (하위 호환)
  const showAddButton = canAddStaff ?? isAdmin;

  return (
    <div className="flex flex-col gap-2 md:gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-h1">
          {t('title')}
        </h1>
        <div className="mt-1.5 sm:mt-2 text-body">
          <p className="md:hidden">• {t(GUIDE_MESSAGE_KEYS[0])}</p>
          <div className="hidden md:block space-y-1">
            {GUIDE_MESSAGE_KEYS.map((key) => (
              <p key={key}>• {t(key)}</p>
            ))}
          </div>
        </div>
      </div>
      {showAddButton && (
        <Button
          variant="outline"
          className="w-full sm:w-auto h-10 md:h-10 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          onClick={onInviteClick}
        >
          {t('register')}
        </Button>
      )}
    </div>
  );
});

export default StaffPageHeader;
