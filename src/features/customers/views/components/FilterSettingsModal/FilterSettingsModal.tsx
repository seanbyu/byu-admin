'use client';

import { memo, useState, useCallback, useMemo } from 'react';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { useTranslations, useLocale } from 'next-intl';
import { GripVertical, Pencil, Trash2, Plus, X, Lock } from 'lucide-react';
import { useCustomerFilters } from '../../../hooks/useCustomerFilters';
import type {
  CustomFilter,
  FilterCondition,
  CustomerFilterField,
  ConditionLogic,
} from '../../../types/filter.types';
import {
  FILTER_FIELD_META,
  FILTER_FIELD_OPTIONS,
} from '../../../types/filter.types';
import { generateFilterKey } from '../../../utils/filterUtils';

// ============================================
// Number Input Component (0 삭제 가능)
// ============================================

const NumberInput = memo(function NumberInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [inputValue, setInputValue] = useState(value > 0 ? String(value) : '');

  // 외부 value 변경 시 동기화
  useMemo(() => {
    setInputValue(value > 0 ? String(value) : '');
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={inputValue}
      onChange={(e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        setInputValue(val);
        onChange(val === '' ? 0 : parseInt(val, 10));
      }}
      placeholder="0"
      className="w-24 px-2 py-1.5 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
    />
  );
});

// ============================================
// Props
// ============================================

interface FilterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonId: string;
}

// ============================================
// Sortable Filter Item
// ============================================

interface SortableFilterItemProps {
  filter: CustomFilter;
  onEdit: (filter: CustomFilter) => void;
  onDelete: (filterId: string) => void;
  isDeleting: boolean;
}

const SortableFilterItem = memo(function SortableFilterItem({
  filter,
  onEdit,
  onDelete,
  isDeleting,
}: SortableFilterItemProps) {
  const t = useTranslations();
  const locale = useLocale();

  // 시스템 필터는 번역 키 사용, 커스텀 필터는 locale별 라벨 사용
  const displayLabel = filter.is_system_filter
    ? t(`customer.filter.${filter.filter_key}`)
    : locale === 'en'
      ? filter.label_en || filter.label
      : locale === 'th'
        ? filter.label_th || filter.label
        : filter.label;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: filter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-white border border-secondary-200 rounded-lg group hover:border-secondary-300 transition-colors"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 text-secondary-400 hover:text-secondary-600 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={18} />
      </button>

      {/* Filter Label */}
      <div className="flex-1 flex items-center gap-2">
        {filter.is_system_filter && (
          <Lock size={14} className="text-secondary-400" />
        )}
        <span className="font-medium text-secondary-900">{displayLabel}</span>
        {filter.conditions.length > 0 && (
          <span className="text-xs text-secondary-500">
            ({t('customer.filterManagement.conditionCount', { count: filter.conditions.length })})
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(filter)}
          className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          title={t('common.edit')}
        >
          <Pencil size={16} />
        </button>
        {!filter.is_system_filter && (
          <button
            onClick={() => onDelete(filter.id)}
            disabled={isDeleting}
            className="p-1.5 text-secondary-500 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
            title={t('common.delete')}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

// ============================================
// Condition Builder
// ============================================

interface ConditionBuilderProps {
  conditions: FilterCondition[];
  conditionLogic: ConditionLogic;
  onChange: (conditions: FilterCondition[], logic: ConditionLogic) => void;
}

const ConditionBuilder = memo(function ConditionBuilder({
  conditions,
  conditionLogic,
  onChange,
}: ConditionBuilderProps) {
  const t = useTranslations();

  const handleAddCondition = useCallback(() => {
    const newCondition: FilterCondition = {
      field: 'total_visits',
      operator: '>=',
      value: 0,
    };
    onChange([...conditions, newCondition], conditionLogic);
  }, [conditions, conditionLogic, onChange]);

  const handleRemoveCondition = useCallback(
    (index: number) => {
      const newConditions = conditions.filter((_, i) => i !== index);
      onChange(newConditions, conditionLogic);
    },
    [conditions, conditionLogic, onChange]
  );

  const handleConditionChange = useCallback(
    (index: number, updates: Partial<FilterCondition>) => {
      const newConditions = conditions.map((c, i) =>
        i === index ? { ...c, ...updates } : c
      );
      onChange(newConditions, conditionLogic);
    },
    [conditions, conditionLogic, onChange]
  );

  const handleLogicChange = useCallback(
    (logic: ConditionLogic) => {
      onChange(conditions, logic);
    },
    [conditions, onChange]
  );

  return (
    <div className="space-y-3">
      {/* Logic Selector */}
      {conditions.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-secondary-600">
            {t('customer.filterManagement.conditionLogic')}:
          </span>
          <select
            value={conditionLogic}
            onChange={(e) => handleLogicChange(e.target.value as ConditionLogic)}
            className="px-2 py-1 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="AND">{t('customer.filterManagement.and')}</option>
            <option value="OR">{t('customer.filterManagement.or')}</option>
          </select>
        </div>
      )}

      {/* Conditions List */}
      <div className="space-y-2">
        {conditions.map((condition, index) => {
          const fieldMeta = FILTER_FIELD_META[condition.field];
          const isBoolean = fieldMeta.type === 'boolean';

          return (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-secondary-50 rounded-lg"
            >
              {/* Field Select */}
              <select
                value={condition.field}
                onChange={(e) =>
                  handleConditionChange(index, {
                    field: e.target.value as CustomerFilterField,
                    operator: FILTER_FIELD_META[e.target.value as CustomerFilterField].operators[0],
                    value: FILTER_FIELD_META[e.target.value as CustomerFilterField].defaultValue,
                  })
                }
                className="flex-1 px-2 py-1.5 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {FILTER_FIELD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>

              {isBoolean ? (
                /* Boolean: 연산자 숨기고 예/아니오만 표시 */
                <select
                  value={condition.value ? 'true' : 'false'}
                  onChange={(e) =>
                    handleConditionChange(index, { operator: '==', value: e.target.value === 'true' })
                  }
                  className="w-24 px-2 py-1.5 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="true">{t('common.yes')}</option>
                  <option value="false">{t('common.no')}</option>
                </select>
              ) : (
                <>
                  {/* Operator Select */}
                  <select
                    value={condition.operator}
                    onChange={(e) =>
                      handleConditionChange(index, { operator: e.target.value as any })
                    }
                    className="w-20 px-2 py-1.5 text-sm border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {fieldMeta.operators.map((op) => (
                      <option key={op} value={op}>
                        {t(`customer.filterManagement.operators.${op === '==' ? 'eq' : op === '!=' ? 'ne' : op === '>' ? 'gt' : op === '<' ? 'lt' : op === '>=' ? 'gte' : 'lte'}`)}
                      </option>
                    ))}
                  </select>

                  {/* Number Value Input */}
                  <NumberInput
                    value={condition.value as number}
                    onChange={(val) => handleConditionChange(index, { value: val })}
                  />
                </>
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveCondition(index)}
                className="p-1 text-secondary-400 hover:text-error-600 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Condition Button */}
      <button
        type="button"
        onClick={handleAddCondition}
        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
      >
        <Plus size={16} />
        {t('customer.filterManagement.addCondition')}
      </button>
    </div>
  );
});

// ============================================
// Filter Edit Form
// ============================================

interface FilterEditFormProps {
  filter: CustomFilter | null;
  existingKeys: string[];
  isNew: boolean;
  onSave: (data: {
    filter_key: string;
    label: string;
    label_en?: string;
    label_th?: string;
    conditions: FilterCondition[];
    condition_logic: ConditionLogic;
  }) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const FilterEditForm = memo(function FilterEditForm({
  filter,
  existingKeys,
  isNew,
  onSave,
  onCancel,
  isSaving,
}: FilterEditFormProps) {
  const t = useTranslations();

  const [label, setLabel] = useState(filter?.label || '');
  const [labelEn, setLabelEn] = useState(filter?.label_en || '');
  const [labelTh, setLabelTh] = useState(filter?.label_th || '');
  const [conditions, setConditions] = useState<FilterCondition[]>(
    filter?.conditions || []
  );
  const [conditionLogic, setConditionLogic] = useState<ConditionLogic>(
    filter?.condition_logic || 'AND'
  );

  const filterKey = useMemo(() => {
    if (filter) return filter.filter_key;
    return generateFilterKey(existingKeys);
  }, [filter, existingKeys]);

  const handleConditionsChange = useCallback(
    (newConditions: FilterCondition[], logic: ConditionLogic) => {
      setConditions(newConditions);
      setConditionLogic(logic);
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!label.trim()) return;

      onSave({
        filter_key: filterKey,
        label: label.trim(),
        label_en: labelEn.trim() || undefined,
        label_th: labelTh.trim() || undefined,
        conditions,
        condition_logic: conditionLogic,
      });
    },
    [filterKey, label, labelEn, labelTh, conditions, conditionLogic, onSave]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-secondary-900">
        {isNew
          ? t('customer.filterManagement.addFilter')
          : t('customer.filterManagement.editFilter')}
      </h3>

      {/* Label Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('customer.filterManagement.filterName')} (한국어) *
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="예: VIP 고객"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              English
            </label>
            <Input
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              placeholder="e.g., VIP Customer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              ภาษาไทย
            </label>
            <Input
              value={labelTh}
              onChange={(e) => setLabelTh(e.target.value)}
              placeholder="เช่น ลูกค้า VIP"
            />
          </div>
        </div>
      </div>

      {/* Conditions */}
      {filter?.filter_key !== 'all' && (
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            {t('customer.filterManagement.conditions')}
          </label>
          <ConditionBuilder
            conditions={conditions}
            conditionLogic={conditionLogic}
            onChange={handleConditionsChange}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-secondary-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" isLoading={isSaving} disabled={!label.trim()}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
});

// ============================================
// Main Modal Component
// ============================================

export const FilterSettingsModal = memo(function FilterSettingsModal({
  isOpen,
  onClose,
  salonId,
}: FilterSettingsModalProps) {
  const t = useTranslations();

  const {
    filters,
    isLoading,
    createFilter,
    isCreating,
    updateFilter,
    isUpdating,
    deleteFilter,
    isDeleting,
    reorderFilters,
  } = useCustomerFilters(salonId);

  const [editingFilter, setEditingFilter] = useState<CustomFilter | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [localFilters, setLocalFilters] = useState<CustomFilter[]>([]);

  // Sync local filters with server filters
  useMemo(() => {
    if (filters.length > 0) {
      setLocalFilters(filters);
    }
  }, [filters]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const existingKeys = useMemo(() => filters.map((f) => f.filter_key), [filters]);

  // Handlers
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = localFilters.findIndex((f) => f.id === active.id);
        const newIndex = localFilters.findIndex((f) => f.id === over.id);
        const newOrder = arrayMove(localFilters, oldIndex, newIndex);

        setLocalFilters(newOrder);
        reorderFilters(newOrder);
      }
    },
    [localFilters, reorderFilters]
  );

  const handleEdit = useCallback((filter: CustomFilter) => {
    setEditingFilter(filter);
    setIsAddingNew(false);
  }, []);

  const handleDelete = useCallback(
    async (filterId: string) => {
      if (confirm(t('customer.filterManagement.deleteConfirm'))) {
        await deleteFilter(filterId);
      }
    },
    [deleteFilter, t]
  );

  const handleAddNew = useCallback(() => {
    setIsAddingNew(true);
    setEditingFilter(null);
  }, []);

  const handleSave = useCallback(
    async (data: {
      filter_key: string;
      label: string;
      label_en?: string;
      label_th?: string;
      conditions: FilterCondition[];
      condition_logic: ConditionLogic;
    }) => {
      if (isAddingNew) {
        await createFilter({
          filter_key: data.filter_key,
          label: data.label,
          label_en: data.label_en,
          label_th: data.label_th,
          conditions: data.conditions,
          condition_logic: data.condition_logic,
        });
      } else if (editingFilter) {
        await updateFilter(editingFilter.id, {
          label: data.label,
          label_en: data.label_en,
          label_th: data.label_th,
          conditions: data.conditions,
          condition_logic: data.condition_logic,
        });
      }

      setEditingFilter(null);
      setIsAddingNew(false);
    },
    [isAddingNew, editingFilter, createFilter, updateFilter]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingFilter(null);
    setIsAddingNew(false);
  }, []);

  // Show form if editing or adding
  const showForm = editingFilter !== null || isAddingNew;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('customer.filterManagement.title')}
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : showForm ? (
        <FilterEditForm
          filter={editingFilter}
          existingKeys={existingKeys}
          isNew={isAddingNew}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          isSaving={isCreating || isUpdating}
        />
      ) : (
        <div className="space-y-4">
          {/* Description */}
          <div className="px-4 py-3 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-700">
              {t('customer.filterManagement.dragHint')}
            </p>
          </div>

          {/* Filter List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localFilters.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localFilters.map((filter) => (
                  <SortableFilterItem
                    key={filter.id}
                    filter={filter}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add New Filter Button */}
          <button
            onClick={handleAddNew}
            className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-secondary-300 rounded-lg text-secondary-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
          >
            <Plus size={20} />
            {t('customer.filterManagement.addFilter')}
          </button>
        </div>
      )}
    </Modal>
  );
});

export default FilterSettingsModal;
