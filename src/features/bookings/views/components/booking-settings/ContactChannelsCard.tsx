'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MessageCircle, Check, ChevronDown } from 'lucide-react';
import { ContactChannels } from '../../../hooks/useSalonSettings';

// LINE 아이콘 컴포넌트
const LineIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    width="20"
    height="20"
  >
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
  </svg>
);

// Instagram 아이콘 컴포넌트
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    width="20"
    height="20"
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

interface ContactChannelsCardProps {
  contactChannels: ContactChannels;
  onToggleChannel: (channel: 'line' | 'instagram') => void;
  onChannelIdChange: (channel: 'line' | 'instagram', id: string) => void;
  onSave: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
}

export const ContactChannelsCard = memo(function ContactChannelsCard({
  contactChannels,
  onToggleChannel,
  onChannelIdChange,
  onSave,
  isSaving,
  saveSuccess,
}: ContactChannelsCardProps) {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-left"
          aria-expanded={isExpanded}
        >
          <MessageCircle size={18} className="text-secondary-600" />
          <h2 className="text-base font-semibold text-secondary-900">
            {t('booking.settings.contactChannels.title')}
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
            <Button variant="primary" size="sm" onClick={onSave} disabled={isSaving}>
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
            {t('booking.settings.contactChannels.description')}
          </p>

          <div className="space-y-4">
            {/* LINE */}
            <div className="p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LineIcon className="text-social-line" />
                  <span className="text-sm font-medium text-secondary-900">LINE</span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleChannel('line')}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    contactChannels.line?.enabled ? 'bg-social-line' : 'bg-secondary-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      contactChannels.line?.enabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {contactChannels.line?.enabled && (
                <div>
                  <Input
                    placeholder={t('booking.settings.contactChannels.linePlaceholder')}
                    value={contactChannels.line?.id || ''}
                    onChange={(e) => onChannelIdChange('line', e.target.value)}
                    className="bg-white"
                  />
                  <p className="text-xs text-secondary-400 mt-1.5">
                    {t('booking.settings.contactChannels.lineHint')}
                  </p>
                </div>
              )}
            </div>

            {/* Instagram */}
            <div className="p-4 bg-secondary-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <InstagramIcon className="text-social-instagram" />
                  <span className="text-sm font-medium text-secondary-900">Instagram</span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleChannel('instagram')}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    contactChannels.instagram?.enabled ? 'bg-social-instagram' : 'bg-secondary-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      contactChannels.instagram?.enabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {contactChannels.instagram?.enabled && (
                <div>
                  <Input
                    placeholder={t('booking.settings.contactChannels.instagramPlaceholder')}
                    value={contactChannels.instagram?.id || ''}
                    onChange={(e) => onChannelIdChange('instagram', e.target.value)}
                    className="bg-white"
                  />
                  <p className="text-xs text-secondary-400 mt-1.5">
                    {t('booking.settings.contactChannels.instagramHint')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});
