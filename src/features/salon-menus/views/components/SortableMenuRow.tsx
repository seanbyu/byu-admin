'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SalonMenu } from '../../types';

interface SortableMenuRowProps {
  menu: SalonMenu;
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
  onDeleteMenu: (id: string) => void;
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
      className={`flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg mb-1 last:mb-0 hover:bg-gray-100 transition-colors group ${
        isDragging ? 'shadow-lg border-blue-200 border' : ''
      }`}
    >
      {currentlyEditing ? (
        <div className="flex w-full items-center justify-between gap-0">
          {/* Name Input */}
          <div className="flex-1 pr-4">
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              placeholder="메뉴명"
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
          <div className="w-24 text-center pr-4">
            <select
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              value={editMenuData.duration}
              onChange={(e) =>
                onEditMenuDataChange({
                  ...editMenuData,
                  duration: e.target.value,
                })
              }
            >
              <option value="15">15분</option>
              <option value="30">30분</option>
              <option value="60">60분</option>
              <option value="90">90분</option>
              <option value="120">120분</option>
            </select>
          </div>

          {/* Price Input */}
          <div className="w-32 text-right pr-4">
            <div className="flex items-center justify-end gap-1">
              <input
                type="number"
                className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-right"
                placeholder="가격"
                value={editMenuData.price}
                onChange={(e) =>
                  onEditMenuDataChange({
                    ...editMenuData,
                    price: e.target.value,
                  })
                }
              />
              <span className="text-sm">원</span>
            </div>
          </div>

          {/* Actions */}
          <div className="w-16 flex justify-end gap-1">
            <Button size="sm" onClick={onSaveMenu}>
              저장
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEditMenu}>
              취소
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Clickable area for editing */}
          <div
            className="flex-1 flex items-center cursor-pointer"
            onClick={() => onEditMenu(menu)}
          >
            <div className="flex-1 text-h4">{menu.name}</div>

            <div className="w-24 text-center text-body">
              {menu.duration_minutes}분
            </div>

            <div className="w-32 text-right text-price">
              {menu.pricing_type === 'FIXED'
                ? `${(menu.base_price || menu.price || 0).toLocaleString()}원`
                : '변동'}
            </div>
          </div>

          <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteMenu(menu.id);
              }}
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              {...attributes}
              {...listeners}
              className="p-1 text-gray-300 cursor-move hover:text-gray-600"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
