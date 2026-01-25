'use client';

import { Layout } from '@/components/layout/Layout';
import { useTranslations } from 'next-intl';

export default function CustomersPage() {
  const t = useTranslations('common');
  return (
    <Layout>
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="text-secondary-500">{t('pages.customers')} - {t('comingSoon')}</div>
      </div>
    </Layout>
  );
}
