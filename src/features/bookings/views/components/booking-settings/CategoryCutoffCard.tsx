'use client';

import { memo, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Check, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { BusinessHours } from '@/types';
import { useCategories } from '@/features/salon-menus/hooks/useSalonMenus';

interface CategoryCutoffCardProps {
  salonId: string;
  businessHours: BusinessHours[];
  slotDuration: number;
  categoryLastBookingTimes: Record<string, string>;
  onCutoffChange: (categoryId: string, time: string) => void;
  onSave: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
}

export const CategoryCutoffCard = memo(function CategoryCutoffCard({
  salonId,
  businessHours,
  slotDuration,
  categoryLastBookingTimes,
  onCutoffChange,
  onSave,
  isSaving,
  saveSuccess,
}: CategoryCutoffCardProps) {
  const t = useTranslations();
  const { categories, isLoading } = useCategories(salonId);
  const [isExpanded, setIsExpanded] = useState(false);

  // 영업 시간 기반 시간 옵션 생성
  const timeOptions = useMemo(() => {
    const openDays = businessHours.filter((bh) => bh.isOpen);
    if (openDays.length === 0) return [];

    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const fromMinutes = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const minOpen = Math.min(...openDays.map((bh) => toMinutes(bh.openTime)));
    const maxClose = Math.max(...openDays.map((bh) => toMinutes(bh.closeTime)));
    const step = slotDuration > 0 ? slotDuration : 30;

    const options: { value: string; label: string }[] = [];
    for (let t = minOpen; t <= maxClose; t += step) {
      const label = fromMinutes(t);
      options.push({ value: label, label });
    }
    return options;
  }, [businessHours, slotDuration]);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-left"
          aria-expanded={isExpanded}
        >
          <Clock size={18} className="text-secondary-600" />
          <h2 className="text-base font-semibold text-secondary-900">
            {t('booking.shopSettingsModal.categoryLastBooking')}
          </h2>
          <ChevronDown
            size={16}
            className={`text-secondary-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        <div className="min-w-[120px] flex justify-end">
          <div
            className={`flex items-center gap-2 transition-all duration-200 ${
              isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
            }`}
          >
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-success-600">
                <Check size={14} />
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </div>

      <div
        aria-hidden={!isExpanded}
        className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin-top] duration-300 ease-out ${
          isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="min-h-0">
          <p className="text-xs text-secondary-500 mb-4">
            {t('booking.shopSettingsModal.categoryLastBookingDesc')}
          </p>

          {isLoading ? (
            <EmptyState message={t('common.loading')} size="sm" />
          ) : categories.length === 0 ? (
            <EmptyState message={t('booking.shopSettingsModal.categoryLastBookingNoCategories')} size="sm" />
          ) : (
            <div className="bg-secondary-50 rounded-lg p-3 space-y-0">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center gap-3 py-3 border-b border-secondary-200 last:border-b-0"
                >
                  <span className="text-sm text-secondary-700 w-28 shrink-0">{category.name}</span>
                  <Select
                    options={[
                      {
                        value: '',
                        label: t('booking.shopSettingsModal.categoryLastBookingNone'),
                      },
                      ...timeOptions,
                    ]}
                    value={categoryLastBookingTimes[category.id] ?? ''}
                    onChange={(e) => onCutoffChange(category.id, e.target.value)}
                    showPlaceholder={false}
                    className="w-32"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});
