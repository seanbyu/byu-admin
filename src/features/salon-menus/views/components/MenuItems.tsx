'use client';

import React, { useState } from 'react';
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
      alert('메뉴명을 입력해주세요.');
      return;
    }
    if (!newMenu.price) {
      alert('금액을 입력해주세요.');
      return;
    }
    try {
      await createMenu({
        name: newMenu.name,
        duration: newMenu.duration,
        price: newMenu.price,
      });
      setNewMenu({ name: '', price: '', duration: 30 });
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      alert('메뉴 추가 실패');
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await deleteMenu(id);
    } catch (e) {
      console.error(e);
      alert('삭제 실패');
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
            placeholder="메뉴명 (예: 다운펌)"
            value={newMenu.name}
            onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
            autoFocus
          />
          <select
            className="w-20 px-2 py-2 text-sm border rounded-md"
            value={newMenu.duration}
            onChange={(e) =>
              setNewMenu({
                ...newMenu,
                duration: Number(e.target.value),
              })
            }
          >
            <option value={15}>15분</option>
            <option value={30}>30분</option>
            <option value={60}>60분</option>
            <option value={90}>90분</option>
            <option value={120}>120분</option>
          </select>
          <div className="flex items-center gap-1 w-24">
            <input
              type="number"
              className="w-full px-2 py-2 text-sm border rounded-md text-right"
              placeholder="0"
              value={newMenu.price}
              onChange={(e) =>
                setNewMenu({ ...newMenu, price: e.target.value })
              }
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">원</span>
          </div>
          <Button size="sm" onClick={handleAddMenu}>
            확인
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAdding(false);
              setNewMenu({ name: '', price: '', duration: 30 });
            }}
          >
            취소
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" /> 메뉴 추가
        </button>
      )}
    </div>
  );
}
