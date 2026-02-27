'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CreateProductCategoryFormProps {
  categoriesCount: number;
  onCreateCategory: (data: { name: string; displayOrder: number }) => Promise<void>;
  onCancel: () => void;
}

export default function CreateProductCategoryForm({
  categoriesCount,
  onCreateCategory,
  onCancel,
}: CreateProductCategoryFormProps) {
  const t = useTranslations();
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreate = async () => {
    if (!newCategoryName.trim()) return;
    await onCreateCategory({
      name: newCategoryName,
      displayOrder: categoriesCount,
    });
    setNewCategoryName('');
  };

  return (
    <div className="mb-4 md:mb-6 bg-white p-3 sm:p-4 md:p-5 xl:p-6 rounded-lg border border-secondary-200 shadow-sm">
      <h3 className="text-sm md:text-base font-semibold mb-3 md:mb-4">
        {t('product.addProductCategory')}
      </h3>
      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 md:gap-2">
        <Input
          placeholder={t('product.categoryNamePlaceholder')}
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="w-full sm:max-w-xs"
          autoFocus
        />
        <Button size="sm" className="h-10 sm:h-9" onClick={handleCreate}>
          {t('common.save')}
        </Button>
        <Button size="sm" className="h-10 sm:h-9" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
