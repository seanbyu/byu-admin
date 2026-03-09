'use client';

import { useTranslations } from 'next-intl';
import type { SalesFilters, SalesPreset } from '../../types';

interface Props {
  filters: SalesFilters;
  onPreset: (preset: SalesPreset) => void;
  onCustomRange: (startDate: string, endDate: string) => void;
}

const PRESETS: SalesPreset[] = ['today', 'week', 'month', 'custom'];

export function SalesFilterBar({ filters, onPreset, onCustomRange }: Props) {
  const t = useTranslations('sales');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-secondary-200 overflow-hidden text-sm">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPreset(p)}
            className={`px-3 py-1.5 font-medium transition-colors ${
              filters.preset === p
                ? 'bg-primary-600 text-white'
                : 'bg-white text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            {t(p)}
          </button>
        ))}
      </div>

      {filters.preset === 'custom' && (
        <div className="flex items-center gap-1.5 text-sm">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onCustomRange(e.target.value, filters.endDate)}
            className="border border-secondary-300 rounded-lg px-2 py-1.5 text-secondary-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <span className="text-secondary-400">–</span>
          <input
            type="date"
            value={filters.endDate}
            min={filters.startDate}
            onChange={(e) => onCustomRange(filters.startDate, e.target.value)}
            className="border border-secondary-300 rounded-lg px-2 py-1.5 text-secondary-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      )}

      <span className="text-xs text-secondary-400 ml-1">
        {filters.startDate === filters.endDate
          ? filters.startDate
          : `${filters.startDate} ~ ${filters.endDate}`}
      </span>
    </div>
  );
}
