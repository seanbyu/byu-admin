'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
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
  onEditMenu: (menu: any) => void;
  onEditMenuDataChange: (data: {
    name: string;
    price: string;
    duration: string;
  }) => void;
  onSaveMenu: () => void;
  onCancelEditMenu: () => void;
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
    <div className="space-y-1">
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
              onEditMenu={onEditMenu}
              onEditMenuDataChange={onEditMenuDataChange}
              onSaveMenu={onSaveMenu}
              onCancelEditMenu={onCancelEditMenu}
              onDeleteMenu={handleDeleteMenu}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add New Menu Form */}
      {isAdding ? (
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-100 mt-2">
          <input
            className="flex-1 px-3 py-2 text-sm border rounded-md"
            placeholder={t('menuNamePlaceholder')}
            value={newMenu.name}
            onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
            autoFocus
          />
          <select
            className="w-24 px-2 py-2 text-sm border rounded-md"
            value={newMenu.duration}
            onChange={(e) =>
              setNewMenu({
                ...newMenu,
                duration: Number(e.target.value),
              })
            }
          >
            <option value={15}>{t('durations.15min')}</option>
            <option value={30}>{t('durations.30min')}</option>
            <option value={60}>{t('durations.60min')}</option>
            <option value={90}>{t('durations.90min')}</option>
            <option value={120}>{t('durations.120min')}</option>
          </select>
          <div className="flex items-center gap-1 w-28">
            <span className="text-sm text-gray-500 whitespace-nowrap">{t('unit.currency')}</span>
            <input
              type="number"
              className="w-full px-2 py-2 text-sm border rounded-md text-right"
              placeholder="0"
              value={newMenu.price}
              onChange={(e) =>
                setNewMenu({ ...newMenu, price: e.target.value })
              }
            />
          </div>
          <Button size="sm" onClick={handleAddMenu}>
            {t('confirm')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAdding(false);
              setNewMenu({ name: '', price: '', duration: 30 });
            }}
          >
            {t('cancel')}
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('addMenu')}
        </button>
      )}
    </div>
  );
}
