'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Trash2 } from 'lucide-react';
import { MenuCategory } from '../../types';

interface CategoryItemProps {
  category: MenuCategory;
  onDelete?: (id: string) => void;
  onEdit?: (category: any) => void;
  isEditing: boolean;
  editName: string;
  onEditNameChange: (val: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  children: React.ReactNode;
}

export default function CategoryItem({
  category,
  onDelete,
  onEdit,
  isEditing,
  editName,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  children,
}: CategoryItemProps) {
  const t = useTranslations();
  return (
    <div className="mb-4 md:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1.5 md:gap-2 mb-2.5 md:mb-3 pb-1.5 md:pb-2 border-b border-gray-200">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-secondary-900">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 md:gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => onEditNameChange(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm md:text-base font-semibold"
                  autoFocus
                />
                <Button size="sm" className="h-10 sm:h-9" onClick={onSaveEdit}>
                  {t('common.save')}
                </Button>
                <Button size="sm" className="h-10 sm:h-9" variant="ghost" onClick={onCancelEdit}>
                  {t('common.cancel')}
                </Button>
              </div>
            ) : (
              category.name
            )}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 self-end sm:self-auto">
          {!isEditing && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(category)}
              className="h-8 text-xs font-normal text-gray-400 hover:text-gray-900 border-gray-200"
            >
              {t('common.edit')}
            </Button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm(t('menu.category.deleteConfirm')))
                  onDelete(category.id);
              }}
              className="text-gray-300 hover:text-red-500 p-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Menus List Content */}
      <div>{children}</div>
    </div>
  );
}
