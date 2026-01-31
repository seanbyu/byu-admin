'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StoreInfo } from '../../types';

interface StoreInfoTabProps {
  storeInfo: StoreInfo | null;
  isLoading: boolean;
  isUpdating: boolean;
  isUploadingImage: boolean;
  onSave: (data: Partial<StoreInfo>) => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
  onDeleteImage: () => Promise<void>;
}

export function StoreInfoTab({
  storeInfo,
  isLoading,
  isUpdating,
  isUploadingImage,
  onSave,
  onUploadImage,
  onDeleteImage,
}: StoreInfoTabProps) {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    instagramUrl: '',
  });

  // Update form when storeInfo changes
  useEffect(() => {
    if (storeInfo) {
      setFormData({
        name: storeInfo.name || '',
        address: storeInfo.address || '',
        phone: storeInfo.phone || '',
        email: storeInfo.email || '',
        description: storeInfo.description || '',
        instagramUrl: storeInfo.instagramUrl || '',
      });
    }
  }, [storeInfo]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    await onSave(formData);
  }, [formData, onSave]);

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await onUploadImage(file);
      }
    },
    [onUploadImage]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-secondary-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Store Image Section */}
      <Card title={t('settings.store.image')}>
        <div className="flex items-start space-x-6">
          <div
            className="w-32 h-32 bg-secondary-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:bg-secondary-200 transition-colors"
            onClick={handleImageClick}
          >
            {storeInfo?.imageUrl ? (
              <img
                src={storeInfo.imageUrl}
                alt={storeInfo.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-12 h-12 text-secondary-400"
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
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImageClick}
                isLoading={isUploadingImage}
              >
                {t('settings.store.changeImage')}
              </Button>
              {storeInfo?.imageUrl && (
                <Button variant="ghost" size="sm" onClick={onDeleteImage}>
                  {t('common.delete')}
                </Button>
              )}
            </div>
            <p className="text-sm text-secondary-500">
              {t('settings.store.imageHint')}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </Card>

      {/* Basic Info Section */}
      <Card title={t('settings.store.basicInfo')}>
        <div className="space-y-4">
          <Input
            label={t('settings.store.name')}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
          <Input
            label={t('settings.store.address')}
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
          />
          <Input
            label={t('settings.store.phone')}
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            type="tel"
          />
          <Input
            label={t('settings.store.email')}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            type="email"
          />
          <Input
            label="Instagram URL"
            value={formData.instagramUrl}
            onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
            placeholder="https://instagram.com/..."
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} isLoading={isUpdating}>
            {t('common.save')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
