'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Plan, Subscription } from '../../types';

interface PlanTabProps {
  plans: Plan[];
  subscription: Subscription | null;
  isLoading: boolean;
  isUpgrading: boolean;
  onUpgrade: (planId: string) => Promise<void>;
}

export function PlanTab({
  plans,
  subscription,
  isLoading,
  isUpgrading,
  onUpgrade,
}: PlanTabProps) {
  const t = useTranslations();

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-secondary-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Current Plan */}
      {subscription && (
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
              {/* Mobile: Next billing on separate line */}
              <p className="text-sm text-secondary-600 sm:hidden">
                {t('settings.plan.nextBilling', {
                  date: formatDate(subscription.nextBillingDate),
                })}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Plan Selection */}
      <Card title={t('settings.plan.changePlan')} padding="sm" className="sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {plans.map((plan) => {
            const isCurrent = subscription?.planId === plan.id;
            const isEnterprise = plan.price === 0 && plan.maxStaff === -1;

            return (
              <div
                key={plan.id}
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
                    <li className="flex items-center text-xs sm:text-sm text-secondary-600">
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
                      {plan.maxStaff === -1
                        ? t('settings.plan.unlimitedStaff')
                        : t('settings.plan.maxStaff', { count: plan.maxStaff })}
                    </li>
                    <li className="flex items-center text-xs sm:text-sm text-secondary-600">
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
                      {plan.maxMenus === null
                        ? t('settings.plan.unlimitedMenus')
                        : t('settings.plan.maxMenus', { count: plan.maxMenus })}
                    </li>
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center text-xs sm:text-sm text-secondary-600"
                      >
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
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 sm:mt-6">
                  {isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>
                      {t('settings.plan.currentPlan')}
                    </Button>
                  ) : isEnterprise ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open('mailto:support@example.com')}
                    >
                      {t('settings.plan.contactSales')}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => onUpgrade(plan.id)}
                      isLoading={isUpgrading}
                    >
                      {t('settings.plan.upgrade')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
