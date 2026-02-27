'use client';

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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ProductCategory } from '../../types';

interface ProductSidebarProps {
  categories: ProductCategory[];
  onAddCategory?: () => void;
  productCounts: Record<string, number>;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onReorderCategories?: (
    categories: { id: string; display_order: number }[]
  ) => void;
}

function SortableCategoryItem({
  category,
  selectedCategoryId,
  onSelectCategory,
  count,
}: {
  category: ProductCategory;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  count: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        selectedCategoryId === category.id
          ? 'bg-primary-50'
          : 'hover:bg-secondary-100'
      }`}
      onClick={() => onSelectCategory(category.id)}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-sidebar-category ${
            selectedCategoryId === category.id
              ? '!font-bold !text-primary-600'
              : ''
          }`}
        >
          {category.name}
        </span>
        <span className="text-caption">{count}</span>
      </div>
      <div {...attributes} {...listeners} className="cursor-grab p-1">
        <Menu className="w-3 h-3 text-secondary-300 opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}

export default function ProductSidebar({
  categories,
  onAddCategory,
  productCounts,
  selectedCategoryId,
  onSelectCategory,
  onReorderCategories,
}: ProductSidebarProps) {
  const t = useTranslations('product');
  const tc = useTranslations('common');
  const totalProducts = Object.values(productCounts).reduce((a, b) => a + b, 0);

  const sortedCategories = [...categories].sort(
    (a, b) => a.display_order - b.display_order
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = sortedCategories.findIndex((c) => c.id === active.id);
      const newIndex = sortedCategories.findIndex((c) => c.id === over?.id);

      const newOrder = arrayMove(sortedCategories, oldIndex, newIndex);
      const updates = newOrder.map((cat, index) => ({
        id: cat.id,
        display_order: index,
      }));

      onReorderCategories?.(updates);
    }
  };

  return (
    <div className="w-full h-full bg-white p-2.5 sm:p-4">
      {/* Mobile: horizontal scroll */}
      <div className="xl:hidden space-y-2">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`w-full rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
            selectedCategoryId === null
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'bg-white border-secondary-200 text-secondary-800'
          }`}
        >
          <span className="text-xs sm:text-sm font-semibold">
            {tc('all')} ({totalProducts})
          </span>
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {sortedCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors ${
                selectedCategoryId === category.id
                  ? 'bg-primary-50 text-primary-600 border-primary-200'
                  : 'bg-white text-secondary-600 border-secondary-200'
              }`}
            >
              {category.name} ({productCounts[category.id] || 0})
            </button>
          ))}
          {onAddCategory && (
            <button
              type="button"
              onClick={onAddCategory}
              className="shrink-0 rounded-full border border-dashed border-secondary-300 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-secondary-500 hover:text-secondary-700"
            >
              + {t('addProductCategory')}
            </button>
          )}
        </div>
      </div>

      {/* Desktop: vertical sidebar */}
      <div className="hidden xl:block space-y-6">
        <div
          onClick={() => onSelectCategory(null)}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${
            selectedCategoryId === null
              ? 'bg-primary-500 text-white'
              : 'bg-white border border-secondary-200 hover:bg-secondary-50'
          }`}
        >
          <div className="font-bold text-lg mb-1">
            {tc('all')}{' '}
            <span className={selectedCategoryId === null ? 'text-white' : ''}>
              {totalProducts}
            </span>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedCategories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {sortedCategories.map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={onSelectCategory}
                  count={productCounts[category.id] || 0}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {onAddCategory && (
          <button
            onClick={onAddCategory}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            <Plus className="w-3 h-3" />
            {t('addProductCategory')}
          </button>
        )}
      </div>
    </div>
  );
}
