'use client';

import { useTranslations } from 'next-intl';

export default function ReviewsPage() {
  const t = useTranslations('common');
  return (
    <div className="flex items-center justify-center h-[calc(100vh-100px)]">
      <div className="text-secondary-500">{t('pages.reviews')} - {t('comingSoon')}</div>
    </div>
  );
}
