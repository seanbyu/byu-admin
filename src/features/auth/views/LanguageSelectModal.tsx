'use client';

import { useState } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LANGUAGES } from '../constants';
import type { LangCode, LanguageSelectModalProps } from '../types';

export function LanguageSelectModal({ onClose }: LanguageSelectModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<LangCode>('en');

  const selectedLang = LANGUAGES.find((l) => l.code === selected)!;

  const handleConfirm = () => {
    router.push(pathname, { locale: selected });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        {/* 타이틀 */}
        <h2 className="text-lg font-bold text-secondary-900 text-center mb-5">
          {selectedLang.title}
        </h2>

        {/* 언어 선택 목록 */}
        <div className="space-y-2 mb-6">
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelected(lang.code)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left',
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-secondary-200 hover:border-secondary-300 bg-white'
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span
                  className={cn(
                    'flex-1 text-sm font-medium',
                    isSelected ? 'text-primary-700' : 'text-secondary-700'
                  )}
                >
                  {lang.label}
                </span>
                {isSelected && (
                  <Check size={16} className="text-primary-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* 확인 버튼 */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {selectedLang.confirmText}
        </button>
      </div>
    </div>
  );
}
