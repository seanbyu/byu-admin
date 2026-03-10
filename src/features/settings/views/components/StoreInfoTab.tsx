'use client';

import { useCallback, useRef, memo } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pencil, Check, X, MapPin } from 'lucide-react';
import { StoreInfo } from '../../types';
import { SettingsTabSkeleton } from '@/components/ui/Skeleton';
import {
  useSettingsUIStore,
  selectEditingField,
  selectTempValue,
  selectSettingsActions,
} from '../../stores/settingsStore';

// ============================================
// Instagram Icon Component (hoisted)
// ============================================

const InstagramIcon = memo(function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
});

// ============================================
// Editable Field Component (memoized)
// ============================================

interface EditableFieldProps {
  value: string;
  placeholder?: string;
  isEditing: boolean;
  tempValue: string;
  isUpdating: boolean;
  icon?: React.ReactNode;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onTempValueChange: (value: string) => void;
  canEdit?: boolean;
}

const EditableField = memo(function EditableField({
  value,
  placeholder,
  isEditing,
  tempValue,
  isUpdating,
  icon,
  onStartEdit,
  onSave,
  onCancel,
  onTempValueChange,
  canEdit = true,
}: EditableFieldProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTempValueChange(e.target.value);
    },
    [onTempValueChange]
  );

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          {icon}
          <Input
            type="text"
            value={tempValue}
            onChange={handleChange}
            placeholder={placeholder}
            className="flex-1 h-10 text-sm bg-white"
            autoFocus
          />
        </div>
        <button
          onClick={onSave}
          disabled={isUpdating}
          className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-colors"
        >
          <Check size={18} />
        </button>
        <button
          onClick={onCancel}
          className="p-2 text-secondary-500 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  const isUrl = value.startsWith('http://') || value.startsWith('https://');

  return (
    <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {icon}
        {isUrl ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 break-all text-sm underline"
          >
            {value}
          </a>
        ) : (
          <span className="text-secondary-900 break-all text-sm">{value || '-'}</span>
        )}
      </div>
      {canEdit && (
        <button
          onClick={onStartEdit}
          className="p-1.5 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-200 rounded-lg transition-colors flex-shrink-0"
        >
          <Pencil size={16} />
        </button>
      )}
    </div>
  );
});

// ============================================
// Store Image Section (memoized)
// ============================================

interface StoreImageSectionProps {
  imageUrl: string | null;
  altText: string;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  canEdit?: boolean;
}

const StoreImageSection = memo(function StoreImageSection({
  imageUrl,
  altText,
  isUploading,
  onUpload,
  onDelete,
  canEdit = true,
}: StoreImageSectionProps) {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await onUpload(file);
        // Reset input value to allow re-uploading same file
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [onUpload]
  );

  return (
    <Card title={t('settings.store.image')} padding="sm" className="sm:p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        <div
          className={`w-24 h-24 sm:w-32 sm:h-32 bg-secondary-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ${canEdit ? 'cursor-pointer hover:bg-secondary-200 transition-colors' : ''}`}
          onClick={canEdit ? handleImageClick : undefined}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={altText}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-secondary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>

        {canEdit && (
          <div className="flex flex-col items-center sm:items-start space-y-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImageClick}
                isLoading={isUploading}
              >
                {t('settings.store.changeImage')}
              </Button>
              {imageUrl && (
                <Button variant="ghost" size="sm" onClick={onDelete}>
                  {t('common.delete')}
                </Button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-secondary-500 text-center sm:text-left">
              {t('settings.store.imageHint')}
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          hidden
        />
      </div>
    </Card>
  );
});

// ============================================
// Main Component Props
// ============================================

interface StoreInfoTabProps {
  storeInfo: StoreInfo | null;
  isLoading: boolean;
  isUpdating: boolean;
  isUploadingImage: boolean;
  onSave: (data: Partial<StoreInfo>) => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
  onDeleteImage: () => Promise<void>;
  canEdit?: boolean;
}

// ============================================
// Main Component
// ============================================

export function StoreInfoTab({
  storeInfo,
  isLoading,
  isUpdating,
  isUploadingImage,
  onSave,
  onUploadImage,
  onDeleteImage,
  canEdit = true,
}: StoreInfoTabProps) {
  const t = useTranslations();

  // Zustand UI state
  const editingField = useSettingsUIStore(selectEditingField);
  const tempValue = useSettingsUIStore(selectTempValue);
  const actions = useSettingsUIStore(selectSettingsActions);

  const instagramUrl = storeInfo?.instagramUrl || '';

  // Save handlers (mutation onSuccess가 캐시 invalidation 처리)
  const handleSaveName = useCallback(async () => {
    if (tempValue.trim()) {
      await onSave({ name: tempValue.trim() });
    }
    actions.finishEditing();
  }, [tempValue, onSave, actions]);

  const handleSaveAddress = useCallback(async () => {
    await onSave({ address: tempValue.trim() });
    actions.finishEditing();
  }, [tempValue, onSave, actions]);

  const handleSaveInstagram = useCallback(async () => {
    await onSave({ instagramUrl: tempValue.trim() });
    actions.finishEditing();
  }, [tempValue, onSave, actions]);

  if (isLoading) {
    return <SettingsTabSkeleton />;
  }

  if (!storeInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-secondary-500">{t('common.error')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Store Image Section */}
      <StoreImageSection
        imageUrl={storeInfo.imageUrl || null}
        altText={storeInfo.name || ''}
        isUploading={isUploadingImage}
        onUpload={onUploadImage}
        onDelete={onDeleteImage}
        canEdit={canEdit}
      />

      {/* Basic Info Section */}
      <Card title={t('settings.store.basicInfo')} padding="sm" className="sm:p-6">
        <div className="space-y-4">
          {/* Store Name */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {t('settings.store.name')}
            </label>
            <EditableField
              value={storeInfo.name || ''}
              isEditing={editingField === 'name'}
              tempValue={tempValue}
              isUpdating={isUpdating}
              onStartEdit={() => actions.startEditing('name', storeInfo.name || '')}
              onSave={handleSaveName}
              onCancel={actions.cancelEditing}
              onTempValueChange={actions.updateTempValue}
              canEdit={canEdit}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {t('settings.store.address')}
            </label>
            <EditableField
              value={storeInfo.address || ''}
              placeholder={t('settings.store.addressPlaceholder')}
              isEditing={editingField === 'address'}
              tempValue={tempValue}
              isUpdating={isUpdating}
              icon={<MapPin size={18} className="text-secondary-400 flex-shrink-0" />}
              onStartEdit={() => actions.startEditing('address', storeInfo.address || '')}
              onSave={handleSaveAddress}
              onCancel={actions.cancelEditing}
              onTempValueChange={actions.updateTempValue}
              canEdit={canEdit}
            />
          </div>
        </div>
      </Card>

      {/* SNS Section */}
      <Card title="SNS" padding="sm" className="sm:p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Instagram
            </label>
            <EditableField
              value={instagramUrl}
              placeholder="https://instagram.com/your_account"
              isEditing={editingField === 'instagram'}
              tempValue={tempValue}
              isUpdating={isUpdating}
              icon={
                <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-primary-500 via-info-500 to-warning-400 rounded flex-shrink-0">
                  <InstagramIcon size={14} />
                </div>
              }
              onStartEdit={() => actions.startEditing('instagram', instagramUrl)}
              onSave={handleSaveInstagram}
              onCancel={actions.cancelEditing}
              onTempValueChange={actions.updateTempValue}
              canEdit={canEdit}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
