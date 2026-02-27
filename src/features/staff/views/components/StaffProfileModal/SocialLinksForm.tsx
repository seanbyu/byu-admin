'use client';

import React, { memo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Instagram, Youtube, Music2, Facebook } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { SocialLinksFormProps, SocialLinksData } from './types';

export const SocialLinksForm = memo(function SocialLinksForm({
  values,
  onChange
}: SocialLinksFormProps) {
  const t = useTranslations();

  const handleChange = useCallback((field: keyof SocialLinksData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(field, e.target.value);
    }, [onChange]);

  return (
    <div className="space-y-4 pt-4 border-t border-secondary-200">
      <label className="block text-sm font-medium text-secondary-700 mb-2">
        {t('staff.profileModal.socialMedia')}
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Instagram size={18} className="text-secondary-400" />
          </div>
          <Input
            type="text"
            className="pl-10 py-2 text-sm"
            value={values.instagram}
            onChange={handleChange('instagram')}
            placeholder="Instagram ID or URL"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Youtube size={18} className="text-secondary-400" />
          </div>
          <Input
            type="text"
            className="pl-10 py-2 text-sm"
            value={values.youtube}
            onChange={handleChange('youtube')}
            placeholder="YouTube Channel"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Music2 size={18} className="text-secondary-400" />
          </div>
          <Input
            type="text"
            className="pl-10 py-2 text-sm"
            value={values.tiktok}
            onChange={handleChange('tiktok')}
            placeholder="TikTok ID"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Facebook size={18} className="text-secondary-400" />
          </div>
          <Input
            type="text"
            className="pl-10 py-2 text-sm"
            value={values.facebook}
            onChange={handleChange('facebook')}
            placeholder="Facebook URL"
          />
        </div>
      </div>
    </div>
  );
});
