'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus } from 'lucide-react';
import { useProductMutations } from '../../hooks/useProducts';
import { Product } from '../../types';
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
import SortableProductRow from './SortableProductRow';

interface ProductItemsProps {
  salonId: string;
  categoryId: string;
  products: Product[];
  editingProductId: string | null;
  editProductData: { name: string; price: string };
  onEditProduct?: (product: Product) => void;
  onEditProductDataChange: (data: { name: string; price: string }) => void;
  onSaveProduct: () => void;
  onCancelEditProduct: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function ProductItems({
  salonId,
  categoryId,
  products: productsData,
  editingProductId,
  editProductData,
  onEditProduct,
  onEditProductDataChange,
  onSaveProduct,
  onCancelEditProduct,
  canEdit = true,
  canDelete = true,
}: ProductItemsProps) {
  const t = useTranslations('product');
  const tc = useTranslations('menu');
  const { createProduct, deleteProduct, reorderProducts } = useProductMutations(salonId, categoryId);

  const [orderedProducts, setOrderedProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    if (productsData) {
      const sorted = [...productsData].sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      );
      setOrderedProducts(sorted);
    }
  }, [productsData]);

  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
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
      setOrderedProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        const productsToUpdate = newOrder.map((product, index) => ({
          id: product.id,
          display_order: index,
        }));
        reorderProducts(productsToUpdate);

        return newOrder;
      });
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name.trim()) {
      alert(t('namePlaceholder'));
      return;
    }
    if (!newProduct.price) {
      alert(t('pricePlaceholder'));
      return;
    }
    try {
      const nextDisplayOrder = orderedProducts.length;
      await createProduct({
        name: newProduct.name,
        price: Number(newProduct.price),
        displayOrder: nextDisplayOrder,
      });
      setNewProduct({ name: '', price: '' });
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      alert(t('saveSuccess'));
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await deleteProduct(id);
    } catch (e) {
      console.error(e);
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
          items={orderedProducts.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedProducts.map((product) => (
            <SortableProductRow
              key={product.id}
              product={product}
              editingProductId={editingProductId}
              editProductData={editProductData}
              onEditProduct={canEdit ? onEditProduct : undefined}
              onEditProductDataChange={onEditProductDataChange}
              onSaveProduct={onSaveProduct}
              onCancelEditProduct={onCancelEditProduct}
              onDeleteProduct={canDelete ? handleDeleteProduct : undefined}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add New Product Form */}
      {canEdit && (
        isAdding ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 md:gap-2 p-3 sm:p-4 md:p-4 bg-primary-50 rounded-lg border border-primary-100 mt-1.5 md:mt-2">
            <div className="w-full sm:flex-1">
              <Input
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs md:text-sm rounded-md"
                placeholder={t('namePlaceholder')}
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-1 w-full sm:w-28">
              <span className="text-xs md:text-sm text-secondary-500 whitespace-nowrap">{tc('unit.currency')}</span>
              <Input
                type="number"
                className="w-full px-2 py-1.5 sm:py-2 text-xs md:text-sm rounded-md text-right"
                placeholder="0"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 sm:ml-auto">
              <Button size="sm" className="h-10 sm:h-9 whitespace-nowrap shrink-0" onClick={handleAddProduct}>
                {tc('confirm')}
              </Button>
              <Button
                size="sm"
                className="h-10 sm:h-9 whitespace-nowrap shrink-0"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewProduct({ name: '', price: '' });
                }}
              >
                {tc('cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-1.5 md:gap-2 py-1.5 sm:py-2 text-xs md:text-sm text-secondary-400 hover:text-secondary-600 hover:bg-secondary-50 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" /> {t('addProduct')}
          </button>
        )
      )}
    </div>
  );
}
