'use client';

import { useEffect, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { useSalonSettings, useInterpreterSettingsMutation } from '../hooks/useSalonSettings';
import { useSettingsFormStore } from '../stores/settingsStore';
import { InterpreterServiceCard } from './booking-settings';
import { SupportedLanguage } from '../constants';

interface InterpreterServiceSectionProps {
  salonId: string;
}

export function InterpreterServiceSection({ salonId }: InterpreterServiceSectionProps) {
  const t = useTranslations();

  // Tanstack Query - fetch settings
  const { data, isLoading } = useSalonSettings(salonId);

  // Mutation
  const interpreterMutation = useInterpreterSettingsMutation(salonId);

  // Local state for save feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Zustand store for form state
  const {
    interpreterEnabled,
    supportedLanguages,
    initializeFromServer,
    toggleInterpreterEnabled,
    toggleLanguage,
    markClean,
  } = useSettingsFormStore();

  // Initialize form from server data
  useEffect(() => {
    if (data) {
      initializeFromServer({
        settings: data.settings,
      });
    }
  }, [data, initializeFromServer]);

  // Handlers
  const handleToggleInterpreter = useCallback(() => {
    toggleInterpreterEnabled();
  }, [toggleInterpreterEnabled]);

  const handleToggleLanguage = useCallback(
    (lang: SupportedLanguage) => {
      toggleLanguage(lang);
    },
    [toggleLanguage]
  );

  const handleSave = useCallback(async () => {
    try {
      await interpreterMutation.mutateInterpreterSettings(
        interpreterEnabled,
        supportedLanguages
      );
      markClean();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save interpreter settings:', error);
    }
  }, [interpreterEnabled, supportedLanguages, interpreterMutation, markClean]);

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-center py-8">
          <div className="text-secondary-500">{t('common.loading')}</div>
        </div>
      </Card>
    );
  }

  return (
    <InterpreterServiceCard
      interpreterEnabled={interpreterEnabled}
      supportedLanguages={supportedLanguages}
      onToggleInterpreter={handleToggleInterpreter}
      onToggleLanguage={handleToggleLanguage}
      onSave={handleSave}
      isSaving={interpreterMutation.isPending}
      saveSuccess={saveSuccess}
    />
  );
}
