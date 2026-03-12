'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../../constants';

interface InterpreterServiceCardProps {
  interpreterEnabled: boolean;
  supportedLanguages: SupportedLanguage[];
  onToggleInterpreter: () => void;
  onToggleLanguage: (lang: SupportedLanguage) => void;
  onSave: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
  isDirty: boolean;
}

export const InterpreterServiceCard = memo(function InterpreterServiceCard({
  interpreterEnabled,
  supportedLanguages,
  onToggleInterpreter,
  onToggleLanguage,
  onSave,
  isSaving,
  saveSuccess,
  isDirty,
}: InterpreterServiceCardProps) {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card padding="none" className="p-3 sm:p-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-left"
          aria-expanded={isExpanded}
        >
          <Globe size={18} className="text-secondary-600" />
          <h2 className="text-base font-semibold text-secondary-900">
            {t('booking.settings.interpreter.title')}
          </h2>
          <ChevronDown
            size={16}
            className={`text-secondary-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        <div className="min-w-[120px] flex justify-end">
          <div
            className={`flex items-center gap-2 transition-all duration-200 ${
              isExpanded
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-1 pointer-events-none'
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
              disabled={isSaving || !isDirty}
            >
              {isSaving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </div>

      <div
        aria-hidden={!isExpanded}
        className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin-top] duration-300 ease-out ${
          isExpanded
            ? 'grid-rows-[1fr] opacity-100 mt-4'
            : 'grid-rows-[0fr] opacity-0 mt-0'
        }`}
      >
        <div className="space-y-4 min-h-0">
          {/* 통역 서비스 활성화 토글 */}
          <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-secondary-900">
                {t('booking.settings.interpreter.enabled')}
              </p>
              <p className="text-xs text-secondary-500 mt-0.5">
                {t('booking.settings.interpreter.enabledDescription')}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleInterpreter}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                interpreterEnabled ? 'bg-primary-500' : 'bg-secondary-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  interpreterEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* 지원 언어 선택 */}
          {interpreterEnabled && (
            <div>
              <label className="block text-xs font-medium text-secondary-600 mb-2">
                {t('booking.settings.interpreter.supportedLanguages')}
              </label>
              <p className="text-xs text-secondary-400 mb-3">
                {t('booking.settings.interpreter.supportedLanguagesHint')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = supportedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => onToggleLanguage(lang)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-50'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-secondary-300'
                        }`}
                      >
                        {isSelected && (
                          <Check size={12} className="text-white" />
                        )}
                      </span>
                      <span className="text-sm">
                        {t(`booking.settings.interpreter.languages.${lang}`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});
