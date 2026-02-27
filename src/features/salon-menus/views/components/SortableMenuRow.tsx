'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SalonMenu } from '../../types';

interface SortableMenuRowProps {
  menu: SalonMenu;
  editingMenuId: string | null;
  editMenuData: { name: string; price: string; duration: string };
  onEditMenu?: (menu: any) => void;
  onEditMenuDataChange: (data: {
    name: string;
    price: string;
    duration: string;
  }) => void;
  onSaveMenu: () => void;
  onCancelEditMenu: () => void;
  onDeleteMenu?: (id: string) => void;
}

export default function SortableMenuRow({
  menu,
  editingMenuId,
  editMenuData,
  onEditMenu,
  onEditMenuDataChange,
  onSaveMenu,
  onCancelEditMenu,
  onDeleteMenu,
}: SortableMenuRowProps) {
  const t = useTranslations();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: menu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const currentlyEditing = editingMenuId === menu.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 md:gap-2 py-2.5 md:py-3 px-3 md:px-4 bg-secondary-50 rounded-lg mb-0.5 md:mb-1 last:mb-0 hover:bg-secondary-100 transition-colors group ${
        isDragging ? 'shadow-lg border-primary-200 border' : ''
      }`}
    >
      {currentlyEditing ? (
        <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 md:gap-2">
          {/* Name Input */}
          <div className="w-full sm:flex-1 sm:pr-4">
            <Input
              type="text"
              className="px-2 py-1 text-xs md:text-sm rounded-md"
              placeholder={t('menu.name')}
              value={editMenuData.name}
              onChange={(e) =>
                onEditMenuDataChange({
                  ...editMenuData,
                  name: e.target.value,
                })
              }
              autoFocus
            />
          </div>

          {/* Duration Input */}
          <div className="w-full sm:w-24 text-left sm:text-center sm:pr-4">
            <Select
              className="px-2 py-1 text-xs md:text-sm rounded-md"
              value={editMenuData.duration}
              showPlaceholder={false}
              options={[
                { value: '15', label: t('menu.durations.15min') },
                { value: '30', label: t('menu.durations.30min') },
                { value: '60', label: t('menu.durations.60min') },
                { value: '90', label: t('menu.durations.90min') },
                { value: '120', label: t('menu.durations.120min') },
              ]}
              onChange={(e) =>
                onEditMenuDataChange({
                  ...editMenuData,
                  duration: e.target.value,
                })
              }
            />
          </div>

          {/* Price Input */}
          <div className="w-full sm:w-32 text-left sm:text-right sm:pr-4">
            <div className="flex items-center justify-start sm:justify-end gap-1">
              <span className="text-xs md:text-sm">{t('menu.unit.currency')}</span>
              <Input
                type="number"
                className="w-20 px-2 py-1 text-xs md:text-sm rounded-md text-right"
                placeholder={t('menu.price')}
                value={editMenuData.price}
                onChange={(e) =>
                  onEditMenuDataChange({
                    ...editMenuData,
                    price: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="w-full sm:w-auto flex justify-end gap-1.5 sm:gap-2 sm:ml-auto">
            <Button
              size="sm"
              className="h-9 sm:h-8 whitespace-nowrap shrink-0"
              onClick={onSaveMenu}
            >
              {t('common.save')}
            </Button>
            <Button
              size="sm"
              className="h-9 sm:h-8 whitespace-nowrap shrink-0"
              variant="ghost"
              onClick={onCancelEditMenu}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Clickable area for editing */}
          <div
            className={`flex-1 flex flex-col sm:flex-row sm:items-center gap-0.5 md:gap-0 ${onEditMenu ? 'cursor-pointer' : ''}`}
            onClick={onEditMenu ? () => onEditMenu(menu) : undefined}
          >
            <div className="flex-1 text-sm md:text-base font-semibold text-secondary-900">{menu.name}</div>

            <div className="text-xs md:text-sm text-secondary-600 sm:w-24 sm:text-center">
              {menu.duration_minutes}{t('menu.unit.minutes')}
            </div>

            <div className="text-sm md:text-base font-semibold text-secondary-900 sm:w-32 sm:text-right">
              {menu.pricing_type === 'FIXED'
                ? `${t('menu.unit.currency')}${(menu.base_price || menu.price || 0).toLocaleString()}`
                : t('common.currency.variable')}
            </div>
          </div>

          <div className="w-full sm:w-16 flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {onDeleteMenu && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMenu(menu.id);
                }}
                className="p-1 text-secondary-400 hover:text-error-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onEditMenu && (
              <button
                {...attributes}
                {...listeners}
                className="p-1 text-secondary-300 cursor-move hover:text-secondary-600"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
