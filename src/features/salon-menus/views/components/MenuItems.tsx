'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Plus } from 'lucide-react';
import { useMenus } from '../../hooks/useSalonMenus';
import { SalonMenu } from '../../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableMenuRow from './SortableMenuRow';

interface MenuItemsProps {
  salonId: string;
  categoryId: string;
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
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function MenuItems({
  salonId,
  categoryId,
  editingMenuId,
  editMenuData,
  onEditMenu,
  onEditMenuDataChange,
  onSaveMenu,
  onCancelEditMenu,
  canEdit = true,
  canDelete = true,
}: MenuItemsProps) {
  const t = useTranslations('menu');
  const {
    data: menusData,
    createMenu,
    deleteMenu,
    reorderMenus,
  } = useMenus(salonId, categoryId);

  // Optimistic UI state for sorting
  const [orderedMenus, setOrderedMenus] = React.useState<SalonMenu[]>([]);

  React.useEffect(() => {
    if (menusData) {
      // Sort by display_order if available, otherwise by creation/default
      const sorted = [...menusData].sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      );
      setOrderedMenus(sorted);
    }
  }, [menusData]);

  const [isAdding, setIsAdding] = useState(false);
  const [newMenu, setNewMenu] = useState({
    name: '',
    price: '',
    duration: 30,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedMenus((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Call API
        const menusToUpdate = newOrder.map((menu, index) => ({
          id: menu.id,
          display_order: index,
        }));
        reorderMenus(menusToUpdate);

        return newOrder;
      });
    }
  };

  const handleAddMenu = async () => {
    if (!newMenu.name.trim()) {
      alert(t('errors.menuNameRequired'));
      return;
    }
    if (!newMenu.price) {
      alert(t('errors.priceRequired'));
      return;
    }
    try {
      // 마지막 순서 계산 (현재 메뉴 개수)
      const nextDisplayOrder = orderedMenus.length;
      await createMenu({
        name: newMenu.name,
        duration: newMenu.duration,
        price: Number(newMenu.price),
        displayOrder: nextDisplayOrder,
      } as any);
      setNewMenu({ name: '', price: '', duration: 30 });
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      alert(t('errors.menuAddFailed'));
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm(t('category.deleteConfirm'))) return;
    try {
      await deleteMenu(id);
    } catch (e) {
      console.error(e);
      alert(t('errors.deleteFailed'));
    }
  };

  return (
    <div className="space-y-0.5 md:space-y-1">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedMenus.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedMenus.map((menu) => (
            <SortableMenuRow
              key={menu.id}
              menu={menu}
              editingMenuId={editingMenuId}
              editMenuData={editMenuData}
              onEditMenu={canEdit ? onEditMenu : undefined}
              onEditMenuDataChange={onEditMenuDataChange}
              onSaveMenu={onSaveMenu}
              onCancelEditMenu={onCancelEditMenu}
              onDeleteMenu={canDelete ? handleDeleteMenu : undefined}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add New Menu Form */}
      {canEdit && (
        isAdding ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 md:gap-2 p-3 sm:p-4 md:p-4 bg-primary-50 rounded-lg border border-primary-100 mt-1.5 md:mt-2">
            <div className="w-full sm:flex-1">
              <Input
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs md:text-sm rounded-md"
                placeholder={t('menuNamePlaceholder')}
                value={newMenu.name}
                onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="w-full sm:w-24">
              <Select
                className="px-2 py-1.5 sm:py-2 text-xs md:text-sm rounded-md"
                value={String(newMenu.duration)}
                showPlaceholder={false}
                options={[
                  { value: '15', label: t('durations.15min') },
                  { value: '30', label: t('durations.30min') },
                  { value: '60', label: t('durations.60min') },
                  { value: '90', label: t('durations.90min') },
                  { value: '120', label: t('durations.120min') },
                ]}
                onChange={(e) =>
                  setNewMenu({
                    ...newMenu,
                    duration: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-center gap-1 w-full sm:w-28">
              <span className="text-xs md:text-sm text-secondary-500 whitespace-nowrap">{t('unit.currency')}</span>
              <Input
                type="number"
                className="w-full px-2 py-1.5 sm:py-2 text-xs md:text-sm rounded-md text-right"
                placeholder="0"
                value={newMenu.price}
                onChange={(e) =>
                  setNewMenu({ ...newMenu, price: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 sm:ml-auto">
              <Button
                size="sm"
                className="h-10 sm:h-9 whitespace-nowrap shrink-0"
                onClick={handleAddMenu}
              >
                {t('confirm')}
              </Button>
              <Button
                size="sm"
                className="h-10 sm:h-9 whitespace-nowrap shrink-0"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewMenu({ name: '', price: '', duration: 30 });
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 md:gap-2 py-1.5 sm:py-2 text-xs md:text-sm text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" /> {t('addMenu')}
          </button>
        )
      )}
    </div>
  );
}
