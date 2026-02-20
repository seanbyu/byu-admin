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
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MenuCategory, SalonIndustry } from '../../types';

interface MenusSidebarProps {
  categories: MenuCategory[];
  orderedIndustries: SalonIndustry[];
  selectedIndustryId: string | 'all';
  onSelectIndustry: (id: string | 'all') => void;
  onAddCategory?: (industryId?: string) => void;
  menuCounts: Record<string, number>;
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
  category: MenuCategory;
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
        selectedCategoryId === category.id ? 'bg-blue-50' : 'hover:bg-gray-100'
      }`}
      onClick={() => onSelectCategory(category.id)}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-sidebar-category ${
            selectedCategoryId === category.id
              ? '!font-bold !text-blue-600'
              : ''
          }`}
        >
          {category.name}
        </span>
        <span className="text-caption">{count}</span>
      </div>
      <div {...attributes} {...listeners} className="cursor-grab p-1">
        <Menu className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />
      </div>
    </div>
  );
}

export default function MenusSidebar({
  categories,
  orderedIndustries,
  selectedIndustryId,
  onSelectIndustry,
  onAddCategory,
  menuCounts,
  selectedCategoryId,
  onSelectCategory,
  onReorderCategories,
}: MenusSidebarProps) {
  const t = useTranslations('menu');
  const totalMenus = Object.values(menuCounts).reduce((a, b) => a + b, 0);
  const addCategoryIndustryId =
    selectedIndustryId === 'all' ? orderedIndustries[0]?.id : selectedIndustryId;

  const filteredCategories = useMemo(() => {
    const byIndustry =
      selectedIndustryId === 'all'
        ? categories
        : categories.filter((category) => category.industry_id === selectedIndustryId);
    return [...byIndustry].sort((a, b) => a.display_order - b.display_order);
  }, [categories, selectedIndustryId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (
    event: DragEndEvent,
    industryCategories: MenuCategory[]
  ) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = industryCategories.findIndex((c) => c.id === active.id);
      const newIndex = industryCategories.findIndex((c) => c.id === over?.id);

      const newOrder = arrayMove(industryCategories, oldIndex, newIndex);

      // Update display_order based on new index
      const updates = newOrder.map((cat, index) => ({
        id: cat.id,
        display_order: index,
      }));

      onReorderCategories?.(updates);
    }
  };

  return (
    <div className="w-full h-full bg-white p-2.5 sm:p-4">
      <div className="xl:hidden space-y-2">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`w-full rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
            selectedCategoryId === null
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'bg-white border-gray-200 text-gray-800'
          }`}
        >
          <span className="text-xs sm:text-sm font-semibold">
            {t('allMenus')} ({totalMenus})
          </span>
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors ${
                selectedCategoryId === category.id
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {category.name} ({menuCounts[category.id] || 0})
            </button>
          ))}
          {onAddCategory && (
            <button
              type="button"
              onClick={() => onAddCategory(addCategoryIndustryId)}
              className="shrink-0 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-[11px] sm:text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              + {t('addGroup')}
            </button>
          )}
        </div>
      </div>

      <div className="hidden xl:block space-y-6">
        <div
          onClick={() => onSelectCategory(null)}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${
            selectedCategoryId === null
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="font-bold text-lg mb-1">
            {t('allMenus')}{' '}
            <span className={selectedCategoryId === null ? 'text-white' : ''}>
              {totalMenus}
            </span>
          </div>
        </div>

        {orderedIndustries.map((industry) => {
          const industryCategories = categories
            .filter((c) => c.industry_id === industry.id)
            .sort((a, b) => a.display_order - b.display_order);

          return (
            <div key={industry.id} className="space-y-2">
              <div className="text-sidebar-industry px-2 mb-2">
                {industry.name}
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, industryCategories)}
              >
                <SortableContext
                  items={industryCategories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {industryCategories.map((category) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        selectedCategoryId={selectedCategoryId}
                        onSelectCategory={onSelectCategory}
                        count={menuCounts[category.id] || 0}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {onAddCategory && (
                <button
                  onClick={() => onAddCategory(industry.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {t('addGroup')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
