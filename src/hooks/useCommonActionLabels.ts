'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

export function useCommonActionLabels() {
  const t = useTranslations('common');

  return useMemo(
    () => ({
      save: t('save'),
      cancel: t('cancel'),
      confirm: t('confirm'),
    }),
    [t]
  );
}
