'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';

export const CancellationFeeTabContent = memo(
  function CancellationFeeTabContent() {
    const t = useTranslations();

    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-secondary-400 md:h-[320px] md:text-base lg:h-[400px]">
        {t('common.comingSoon')}
      </div>
    );
  }
);
