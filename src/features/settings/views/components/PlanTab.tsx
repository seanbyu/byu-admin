'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Plan, Subscription } from '../../types';

// ============================================
// Formatters - 컴포넌트 외부에 hoisted
// ============================================

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// ============================================
// Check Icon - hoisted static JSX
// ============================================

const CheckIcon = (
  <svg
    className="w-4 h-4 mr-2 text-primary-500 flex-shrink-0"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

// ============================================
// Feature Item Component (memoized)
// ============================================

interface FeatureItemProps {
  text: string;
}

const FeatureItem = memo(function FeatureItem({ text }: FeatureItemProps) {
  return (
    <li className="flex items-center text-xs sm:text-sm text-secondary-600">
      {CheckIcon}
      {text}
    </li>
  );
});

// ============================================
// Plan Card Component (memoized)
// ============================================

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  isUpgrading: boolean;
  onUpgrade: (planId: string) => void;
}

const PlanCard = memo(function PlanCard({
  plan,
  isCurrent,
  isUpgrading,
  onUpgrade,
}: PlanCardProps) {
  const t = useTranslations();
  const isEnterprise = plan.price === 0 && plan.maxStaff === -1;

  const staffText = useMemo(() => {
    return plan.maxStaff === -1
      ? t('settings.plan.unlimitedStaff')
      : t('settings.plan.maxStaff', { count: plan.maxStaff });
  }, [plan.maxStaff, t]);

  const menuText = useMemo(() => {
    return plan.maxMenus === null
      ? t('settings.plan.unlimitedMenus')
      : t('settings.plan.maxMenus', { count: plan.maxMenus });
  }, [plan.maxMenus, t]);

  const handleUpgrade = () => onUpgrade(plan.id);
  const handleContactSales = () => window.open('mailto:support@example.com');

  return (
    <div
      className={cn(
        'border rounded-lg p-4 sm:p-6 transition-all',
        isCurrent
          ? 'border-primary-500 bg-primary-50'
          : 'border-secondary-200 hover:border-primary-300'
      )}
    >
      <h4 className="text-base sm:text-lg font-semibold text-secondary-900">
        {plan.name}
      </h4>
      <div className="mt-2">
        {isEnterprise ? (
          <span className="text-xl sm:text-2xl font-bold text-secondary-900">
            {t('settings.plan.contactUs')}
          </span>
        ) : (
          <>
            <span className="text-xl sm:text-2xl font-bold text-secondary-900">
              {formatPrice(plan.price)}
            </span>
            <span className="text-sm text-secondary-500">
              {t('settings.plan.perMonth')}
            </span>
          </>
        )}
      </div>

      <div className="mt-3 sm:mt-4 border-t border-secondary-200 pt-3 sm:pt-4">
        <ul className="space-y-2">
          <FeatureItem text={staffText} />
          <FeatureItem text={menuText} />
          {plan.features.map((feature, idx) => (
            <FeatureItem key={idx} text={feature} />
          ))}
        </ul>
      </div>

      <div className="mt-4 sm:mt-6">
        {isCurrent ? (
          <Button variant="secondary" className="w-full" disabled>
            {t('settings.plan.currentPlan')}
          </Button>
        ) : isEnterprise ? (
          <Button variant="outline" className="w-full" onClick={handleContactSales}>
            {t('settings.plan.contactSales')}
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            onClick={handleUpgrade}
            isLoading={isUpgrading}
          >
            {t('settings.plan.upgrade')}
          </Button>
        )}
      </div>
    </div>
  );
});

// ============================================
// Current Plan Section (memoized)
// ============================================

interface CurrentPlanSectionProps {
  subscription: Subscription;
}

const CurrentPlanSection = memo(function CurrentPlanSection({
  subscription,
}: CurrentPlanSectionProps) {
  const t = useTranslations();

  return (
    <Card title={t('settings.plan.current')} padding="sm" className="sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-base sm:text-lg font-semibold text-secondary-900">
              {subscription.planName}
            </h4>
            <Badge variant="success">{t('settings.plan.active')}</Badge>
          </div>
          <p className="text-sm text-secondary-600 mt-1">
            {t('settings.plan.monthlyPrice', {
              price: formatPrice(subscription.price),
            })}
            <span className="hidden sm:inline">
              {' · '}
              {t('settings.plan.nextBilling', {
                date: formatDate(subscription.nextBillingDate),
              })}
            </span>
          </p>
          <p className="text-sm text-secondary-600 sm:hidden">
            {t('settings.plan.nextBilling', {
              date: formatDate(subscription.nextBillingDate),
            })}
          </p>
        </div>
      </div>
    </Card>
  );
});

// ============================================
// Main Component Props
// ============================================

interface PlanTabProps {
  plans: Plan[];
  subscription: Subscription | null;
  isLoading: boolean;
  isUpgrading: boolean;
  onUpgrade: (planId: string) => Promise<void>;
}

// ============================================
// Main Component
// ============================================

export function PlanTab({
  plans,
  subscription,
  isLoading,
  isUpgrading,
  onUpgrade,
}: PlanTabProps) {
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-secondary-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {subscription && <CurrentPlanSection subscription={subscription} />}

      <Card title={t('settings.plan.changePlan')} padding="sm" className="sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={subscription?.planId === plan.id}
              isUpgrading={isUpgrading}
              onUpgrade={onUpgrade}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
