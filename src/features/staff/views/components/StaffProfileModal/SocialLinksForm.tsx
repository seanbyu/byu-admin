'use client';

import React, { memo } from 'react';
import { useTranslations } from 'next-intl';
import { Instagram, Youtube, Music2, Facebook } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { SocialLinksFormProps } from './types';

export const SocialLinksForm = memo(function SocialLinksForm({ register }: SocialLinksFormProps) {
  const t = useTranslations();

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
            className="pl-10"
            {...register('socialLinks.instagram')}
            placeholder="Instagram ID or URL"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Youtube size={18} className="text-secondary-400" />
          </div>
          <Input
            className="pl-10"
            {...register('socialLinks.youtube')}
            placeholder="YouTube Channel"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Music2 size={18} className="text-secondary-400" />
          </div>
          <Input
            className="pl-10"
            {...register('socialLinks.tiktok')}
            placeholder="TikTok ID"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Facebook size={18} className="text-secondary-400" />
          </div>
          <Input
            className="pl-10"
            {...register('socialLinks.facebook')}
            placeholder="Facebook URL"
          />
        </div>
      </div>
    </div>
  );
});
