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
import { MenuCategory, SalonIndustry } from '../../types';

interface MenusSidebarProps {
  categories: MenuCategory[];
  orderedIndustries: SalonIndustry[];
  selectedIndustryId: string | 'all';
  onSelectIndustry: (id: string | 'all') => void;
  onAddCategory: (industryId?: string) => void;
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
  const totalMenus = Object.values(menuCounts).reduce((a, b) => a + b, 0);

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
    <div className="w-full h-full bg-white p-4">
      <div className="space-y-6">
        {/* All Menus Summary Card */}
        <div
          onClick={() => onSelectCategory(null)}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${
            selectedCategoryId === null
              ? 'bg-blue-500 text-white'
              : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="font-bold text-lg mb-1">
            전체 메뉴{' '}
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
              <button
                onClick={() => onAddCategory(industry.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="w-3 h-3" />
                그룹 추가
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
