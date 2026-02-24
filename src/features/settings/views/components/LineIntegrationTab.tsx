'use client';

import { useState, useCallback, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Check, AlertCircle, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useLineSettings } from '../../hooks/useLineSettings';
import { useToast } from '@/components/ui/ToastProvider';

// ============================================
// LINE Icon Component
// ============================================

const LineIcon = memo(function LineIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#06C755">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
});

// ============================================
// Status Badge Component
// ============================================

const StatusBadge = memo(function StatusBadge({
  isConnected,
  isVerified,
  isActive,
  t,
}: {
  isConnected: boolean;
  isVerified: boolean;
  isActive: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  if (!isConnected) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-600">
        {t('settings.line.statusNotConnected')}
      </span>
    );
  }
  if (!isVerified) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <AlertCircle size={12} />
        {t('settings.line.statusUnverified')}
      </span>
    );
  }
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-600">
        {t('settings.line.statusInactive')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <Check size={12} />
      {t('settings.line.statusConnected')}
    </span>
  );
});

// ============================================
// Secret Input Component
// ============================================

interface SecretInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}

const SecretInput = memo(function SecretInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: SecretInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-secondary-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 px-3 pr-10 text-sm border border-secondary-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-secondary-400 hover:text-secondary-600"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
});

// ============================================
// Main Component
// ============================================

interface LineIntegrationTabProps {
  salonId: string;
  canEdit?: boolean;
}

export function LineIntegrationTab({ salonId, canEdit = true }: LineIntegrationTabProps) {
  const t = useTranslations();
  const toast = useToast();
  const {
    settings,
    isLoading,
    isConnected,
    isVerified,
    isActive,
    save,
    isSaving,
    toggle,
    isToggling,
    remove,
    isRemoving,
    verify,
    isVerifying,
  } = useLineSettings(salonId);

  // Form state
  const [channelId, setChannelId] = useState('');
  const [channelSecret, setChannelSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [liffId, setLiffId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form when settings load
  const initForm = useCallback(() => {
    if (settings) {
      setChannelId(settings.lineChannelId);
      setChannelSecret(settings.lineChannelSecret);
      setAccessToken(settings.lineChannelAccessToken);
      setLiffId(settings.liffId);
    }
  }, [settings]);

  const handleStartEdit = useCallback(() => {
    initForm();
    setIsEditing(true);
  }, [initForm]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setChannelId('');
    setChannelSecret('');
    setAccessToken('');
    setLiffId('');
  }, []);

  const handleSave = useCallback(async () => {
    if (!channelId.trim() || !channelSecret.trim() || !accessToken.trim()) {
      toast.error(t('settings.line.requiredFieldsError'));
      return;
    }

    try {
      await save({
        lineChannelId: channelId.trim(),
        lineChannelSecret: channelSecret.trim(),
        lineChannelAccessToken: accessToken.trim(),
        liffId: liffId.trim() || undefined,
      });
      setIsEditing(false);
      toast.success(t('common.saved'));
    } catch {
      toast.error(t('common.error'));
    }
  }, [channelId, channelSecret, accessToken, liffId, save, toast, t]);

  const handleVerify = useCallback(async () => {
    try {
      console.log('[LineIntegrationTab] 검증 시작 - salonId:', salonId);
      const result = await verify();
      console.log('[LineIntegrationTab] 검증 결과:', result);
      if (result.success) {
        toast.success(t('settings.line.verifySuccess'));
      } else {
        toast.error(t('settings.line.verifyFailed') + (result.error ? `: ${result.error}` : ''));
      }
    } catch (err) {
      console.error('[LineIntegrationTab] 검증 예외:', err);
      toast.error(t('settings.line.verifyFailed'));
    }
  }, [verify, toast, t, salonId]);

  const handleToggle = useCallback(async () => {
    try {
      await toggle(!isActive);
      toast.success(isActive ? t('settings.line.deactivated') : t('settings.line.activated'));
    } catch {
      toast.error(t('common.error'));
    }
  }, [toggle, isActive, toast, t]);

  const handleDelete = useCallback(async () => {
    try {
      await remove();
      setShowDeleteConfirm(false);
      setIsEditing(false);
      toast.success(t('settings.line.disconnected'));
    } catch {
      toast.error(t('common.error'));
    }
  }, [remove, toast, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-secondary-500">{t('common.loading')}</div>
      </div>
    );
  }

  const isNewSetup = !isConnected && !isEditing;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Card */}
      <Card padding="sm" className="sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-[#06C755]/10 rounded-lg">
              <LineIcon size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-secondary-900">
                {t('settings.line.title')}
              </h3>
              <p className="text-sm text-secondary-500">
                {t('settings.line.description')}
              </p>
            </div>
          </div>
          <StatusBadge isConnected={isConnected} isVerified={isVerified} isActive={isActive} t={t} />
        </div>

        {/* Connected & Not Editing: Show summary */}
        {isConnected && !isEditing && (
          <div className="space-y-4">
            <div className="bg-secondary-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Channel ID</span>
                <span className="font-mono text-secondary-900">{settings?.lineChannelId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Channel Secret</span>
                <span className="font-mono text-secondary-900">{'•'.repeat(16)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Access Token</span>
                <span className="font-mono text-secondary-900">{'•'.repeat(16)}</span>
              </div>
              {settings?.liffId && (
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-500">LIFF ID</span>
                  <span className="font-mono text-secondary-900">{settings.liffId}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <>
                  <Button variant="outline" size="sm" onClick={handleStartEdit}>
                    {t('settings.line.editSettings')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVerify}
                    isLoading={isVerifying}
                  >
                    {t('settings.line.verifyConnection')}
                  </Button>
                  <Button
                    variant={isActive ? 'outline' : 'primary'}
                    size="sm"
                    onClick={handleToggle}
                    isLoading={isToggling}
                  >
                    {isActive ? t('settings.line.deactivate') : t('settings.line.activate')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} className="mr-1" />
                    {t('settings.line.disconnect')}
                  </Button>
                </>
              )}
            </div>

            {/* Verification status */}
            {isVerified && settings?.lastVerifiedAt && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check size={12} />
                {t('settings.line.lastVerified', {
                  date: new Date(settings.lastVerifiedAt).toLocaleDateString(),
                })}
              </p>
            )}
            {!isVerified && settings?.verificationError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {settings.verificationError}
              </p>
            )}
          </div>
        )}

        {/* New Setup: Show CTA */}
        {isNewSetup && canEdit && (
          <div className="text-center py-6 space-y-4">
            <div className="text-secondary-500 text-sm">
              {t('settings.line.notConnectedDescription')}
            </div>
            <Button onClick={() => setIsEditing(true)}>
              <LineIcon size={18} />
              <span className="ml-2">{t('settings.line.connectButton')}</span>
            </Button>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 mb-3">
              {t('settings.line.deleteConfirm')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                isLoading={isRemoving}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                {t('settings.line.confirmDelete')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Form */}
      {isEditing && (
        <Card title={t('settings.line.channelSettings')} padding="sm" className="sm:p-6">
          <div className="space-y-4">
            {/* Channel ID */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                Channel ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="1234567890"
                className="w-full h-10 px-3 text-sm border border-secondary-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              />
            </div>

            {/* Channel Secret */}
            <SecretInput
              label="Channel Secret"
              value={channelSecret}
              onChange={setChannelSecret}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              required
            />

            {/* Channel Access Token */}
            <SecretInput
              label="Channel Access Token"
              value={accessToken}
              onChange={setAccessToken}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              required
            />

            {/* LIFF ID (optional) */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1.5">
                LIFF ID
                <span className="text-secondary-400 text-xs ml-1">({t('common.optional')})</span>
              </label>
              <input
                type="text"
                value={liffId}
                onChange={(e) => setLiffId(e.target.value)}
                placeholder="1234567890-xxxxxxxx"
                className="w-full h-10 px-3 text-sm border border-secondary-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              />
              <p className="mt-1 text-xs text-secondary-400">
                {t('settings.line.liffIdHint')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} isLoading={isSaving}>
                {t('common.save')}
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Help Card */}
      <Card padding="sm" className="sm:p-6">
        <h4 className="font-medium text-secondary-900 mb-3">
          {t('settings.line.helpTitle')}
        </h4>
        <ol className="space-y-2 text-sm text-secondary-600 list-decimal list-inside">
          <li>{t('settings.line.helpStep1')}</li>
          <li>{t('settings.line.helpStep2')}</li>
          <li>{t('settings.line.helpStep3')}</li>
          <li>{t('settings.line.helpStep4')}</li>
        </ol>
        <a
          href="https://developers.line.biz/console/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-sm text-primary-600 hover:text-primary-700"
        >
          LINE Developers Console
          <ExternalLink size={14} />
        </a>
      </Card>
    </div>
  );
}
