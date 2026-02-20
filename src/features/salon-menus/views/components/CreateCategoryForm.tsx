'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SalonIndustry, MenuCategory } from '../../types';

interface CreateCategoryFormProps {
  categories: MenuCategory[];
  orderedIndustries: SalonIndustry[];
  selectedIndustryForCreate: string;
  onSelectIndustryForCreate: (id: string) => void;
  onCreateCategory: (data: {
    name: string;
    displayOrder: number;
    industryId?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function CreateCategoryForm({
  categories,
  orderedIndustries,
  selectedIndustryForCreate,
  onSelectIndustryForCreate,
  onCreateCategory,
  onCancel,
}: CreateCategoryFormProps) {
  const t = useTranslations();
  const [newCategoryName, setNewCategoryName] = useState('');

  // 업종이 선택되지 않았고, 업종 목록이 있으면 첫 번째 업종을 기본 선택
  React.useEffect(() => {
    if (!selectedIndustryForCreate && orderedIndustries.length > 0) {
      onSelectIndustryForCreate(orderedIndustries[0].id);
    }
  }, [selectedIndustryForCreate, orderedIndustries, onSelectIndustryForCreate]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await onCreateCategory({
      name: newCategoryName,
      displayOrder: categories.length + 1,
      industryId: selectedIndustryForCreate || undefined,
    });
    setNewCategoryName('');
  };

  return (
    <div className="mb-4 md:mb-6 bg-white p-3 sm:p-4 md:p-5 xl:p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-sm md:text-base font-semibold mb-3 md:mb-4">{t('menu.addGroup')}</h3>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 md:gap-2">
        <Input
          placeholder={t('menu.categoryPlaceholder')}
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="w-full sm:max-w-xs"
          autoFocus
        />
        {orderedIndustries.length > 0 && (
          <select
            className="h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedIndustryForCreate}
            onChange={(e) => onSelectIndustryForCreate(e.target.value)}
          >
            <option value="">{t('common.select')}</option>
            {orderedIndustries.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.name}
              </option>
            ))}
          </select>
        )}
        <Button size="sm" className="h-10 sm:h-9" onClick={handleCreateCategory}>
          {t('common.save')}
        </Button>
        <Button size="sm" className="h-10 sm:h-9" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
