'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';

export const CancellationFeeTabContent = memo(
  function CancellationFeeTabContent() {
    const t = useTranslations();

    return (
      <div className="flex items-center justify-center h-[400px] text-secondary-400">
        {t('common.comingSoon')}
      </div>
    );
  }
);
