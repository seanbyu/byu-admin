'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Plus } from 'lucide-react';
import { useMenuMutations } from '../../hooks/useSalonMenus';
import { SalonMenu } from '../../types';
import { useToast } from '@/components/ui/ToastProvider';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
  menus: SalonMenu[];
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
  menus: menusData,
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
  const toast = useToast();
  const { createMenu, deleteMenu, reorderMenus } = useMenuMutations(salonId, categoryId);

  // 서버 데이터 정렬 (useEffect 없이 동기적으로 파생)
  const serverSortedMenus = React.useMemo(
    () =>
      [...(menusData || [])].sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      ),
    [menusData]
  );

  // 드래그 중 낙관적 순서 오버라이드 (null = 서버 데이터 사용)
  const [dragOrderedMenus, setDragOrderedMenus] = React.useState<SalonMenu[] | null>(null);
  const orderedMenus = dragOrderedMenus ?? serverSortedMenus;

  const [isAdding, setIsAdding] = useState(false);
  const [newMenu, setNewMenu] = useState({
    name: '',
    price: '',
    duration: 30,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      // 데스크톱: 5px 이동 후 드래그 시작 (클릭과 구분)
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      // 모바일: 250ms 길게 누른 후 드래그 시작 (스크롤과 구분)
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = orderedMenus.findIndex((item) => item.id === active.id);
      const newIndex = orderedMenus.findIndex((item) => item.id === over?.id);
      const newOrder = arrayMove(orderedMenus, oldIndex, newIndex);

      setDragOrderedMenus(newOrder);

      const menusToUpdate = newOrder.map((menu, index) => ({
        id: menu.id,
        display_order: index,
      }));

      // Optimistic: 즉시 토스트, 백그라운드 API 호출
      toast.success(t('success.orderSaved'));
      reorderMenus(menusToUpdate)
        .then(() => setDragOrderedMenus(null))
        .catch(() => {
          setDragOrderedMenus(null);
          toast.error(t('errors.orderChangeFailed'));
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
