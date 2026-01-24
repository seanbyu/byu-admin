'use client';

import { useState } from 'react';
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
  const [newCategoryName, setNewCategoryName] = useState('');

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
    <div className="mb-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="font-semibold mb-4">새 카테고리 추가</h3>
      <div className="flex items-center gap-2">
        <Input
          placeholder="예: 커트, 펌, 컬러"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          className="max-w-xs"
          autoFocus
        />
        {orderedIndustries.length > 0 && (
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedIndustryForCreate}
            onChange={(e) => onSelectIndustryForCreate(e.target.value)}
          >
            <option value="">업종 선택</option>
            {orderedIndustries.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.name}
              </option>
            ))}
          </select>
        )}
        <Button size="sm" onClick={handleCreateCategory}>
          저장
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
}
