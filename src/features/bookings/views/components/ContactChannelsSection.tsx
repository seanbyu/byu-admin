'use client';

import { useEffect, useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AccordionCardSkeleton } from '@/components/ui/Skeleton';
import { useSalonSettings, useContactChannelsMutation } from '../../hooks/useSalonSettings';
import { useSettingsFormStore } from '../../stores/settingsStore';
import { ContactChannelsCard } from './booking-settings';

interface ContactChannelsSectionProps {
  salonId: string;
}

export function ContactChannelsSection({ salonId }: ContactChannelsSectionProps) {
  const t = useTranslations();

  // Tanstack Query - fetch settings
  const { data, isLoading } = useSalonSettings(salonId);

  // Mutation
  const contactChannelsMutation = useContactChannelsMutation(salonId);

  // Local state for save feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Zustand store for form state
  const {
    contactChannels,
    initializeFromServer,
    toggleContactChannel,
    setContactChannelId,
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
  const handleToggleChannel = useCallback(
    (channel: 'line' | 'instagram') => {
      toggleContactChannel(channel);
    },
    [toggleContactChannel]
  );

  const handleChannelIdChange = useCallback(
    (channel: 'line' | 'instagram', id: string) => {
      setContactChannelId(channel, id);
    },
    [setContactChannelId]
  );

  const handleSave = useCallback(async () => {
    try {
      await contactChannelsMutation.mutateContactChannels(contactChannels);
      markClean();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save contact channels settings:', error);
    }
  }, [contactChannels, contactChannelsMutation, markClean]);

  if (isLoading) {
    return <AccordionCardSkeleton />;
  }

  return (
    <ContactChannelsCard
      contactChannels={contactChannels}
      onToggleChannel={handleToggleChannel}
      onChannelIdChange={handleChannelIdChange}
      onSave={handleSave}
      isSaving={contactChannelsMutation.isPending}
      saveSuccess={saveSuccess}
    />
  );
}
