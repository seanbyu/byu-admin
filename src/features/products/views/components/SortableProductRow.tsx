'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Product } from '../../types';

interface SortableProductRowProps {
  product: Product;
  editingProductId: string | null;
  editProductData: { name: string; price: string };
  onEditProduct?: (product: Product) => void;
  onEditProductDataChange: (data: { name: string; price: string }) => void;
  onSaveProduct: () => void;
  onCancelEditProduct: () => void;
  onDeleteProduct?: (id: string) => void;
}

export default function SortableProductRow({
  product,
  editingProductId,
  editProductData,
  onEditProduct,
  onEditProductDataChange,
  onSaveProduct,
  onCancelEditProduct,
  onDeleteProduct,
}: SortableProductRowProps) {
  const t = useTranslations();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const currentlyEditing = editingProductId === product.id;

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
              placeholder={t('product.name')}
              value={editProductData.name}
              onChange={(e) =>
                onEditProductDataChange({
                  ...editProductData,
                  name: e.target.value,
                })
              }
              autoFocus
            />
          </div>

          {/* Price Input */}
          <div className="w-full sm:w-32 text-left sm:text-right sm:pr-4">
            <div className="flex items-center justify-start sm:justify-end gap-1">
              <span className="text-xs md:text-sm">{t('menu.unit.currency')}</span>
              <Input
                type="number"
                className="w-20 px-2 py-1 text-xs md:text-sm rounded-md text-right"
                placeholder={t('product.pricePlaceholder')}
                value={editProductData.price}
                onChange={(e) =>
                  onEditProductDataChange({
                    ...editProductData,
                    price: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="w-full sm:w-auto flex justify-end gap-1.5 sm:gap-2 sm:ml-auto">
            <Button size="sm" className="h-9 sm:h-8 whitespace-nowrap shrink-0" onClick={onSaveProduct}>
              {t('common.save')}
            </Button>
            <Button size="sm" className="h-9 sm:h-8 whitespace-nowrap shrink-0" variant="ghost" onClick={onCancelEditProduct}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Clickable area for editing */}
          <div
            className={`flex-1 flex flex-col sm:flex-row sm:items-center gap-0.5 md:gap-0 ${onEditProduct ? 'cursor-pointer' : ''}`}
            onClick={onEditProduct ? () => onEditProduct(product) : undefined}
          >
            <div className="flex-1 text-sm md:text-base font-semibold text-secondary-900">
              {product.name}
            </div>

            <div className="text-sm md:text-base font-semibold text-secondary-900 sm:w-32 sm:text-right">
              {t('menu.unit.currency')}{(product.price || 0).toLocaleString()}
            </div>
          </div>

          <div className="w-full sm:w-16 flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {onDeleteProduct && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProduct(product.id);
                }}
                className="p-1 text-secondary-400 hover:text-error-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {onEditProduct && (
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
