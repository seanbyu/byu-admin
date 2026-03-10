'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { ProductListContentSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus } from 'lucide-react';
import { useProductCategories, useProducts } from '../../hooks/useProducts';
import { ProductCategory, Product } from '../../types';
import { formatPrice } from '@/lib/utils';

import ProductSidebar from './ProductSidebar';
import CreateProductCategoryForm from './CreateProductCategoryForm';
import ProductCategoryItem from './ProductCategoryItem';
import ProductItems from './ProductItems';

interface ProductListProps {
  salonId: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

export default function ProductList({
  salonId,
  canEdit = true,
  canDelete = true,
}: ProductListProps) {
  const t = useTranslations('product');
  const tc = useTranslations('common');

  const {
    categories,
    isLoading,
    createCategory,
    deleteCategory,
    reorderCategories,
    updateCategory,
  } = useProductCategories(salonId);

  const { products: allProducts, updateProduct } = useProducts(salonId);

  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Category editing state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Product editing state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editProductData, setEditProductData] = useState({
    name: '',
    price: '',
  });

  const handleCreateCategory = async (data: { name: string; displayOrder: number }) => {
    try {
      await createCategory(data);
      setIsCreating(false);
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error');
    }
  };

  const handleStartEditCategory = (category: ProductCategory) => {
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
  };

  const handleSaveCategory = async () => {
    if (!editingCategoryId || !editCategoryName.trim()) return;
    try {
      await updateCategory({ id: editingCategoryId, name: editCategoryName });
      setEditingCategoryId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditProductData({
      name: product.name,
      price: product.price?.toString() || '0',
    });
  };

  const handleSaveProduct = async () => {
    if (!editingProductId || !editProductData.name.trim()) return;
    try {
      await updateProduct({
        id: editingProductId,
        updates: {
          name: editProductData.name,
          price: parseInt(editProductData.price) || 0,
        },
      });
      setEditingProductId(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate counts per category
  const productCounts = categories.reduce(
    (acc, cat) => {
      const count = allProducts.filter((p) => p.category_id === cat.id).length;
      acc[cat.id] = count;
      return acc;
    },
    {} as Record<string, number>
  );

  const sortedCategories = [...categories].sort(
    (a, b) => a.display_order - b.display_order
  );

  // Filter categories by selection
  const displayCategories = selectedCategoryId
    ? sortedCategories.filter((c) => c.id === selectedCategoryId)
    : sortedCategories;

  return (
    <div className="flex flex-col xl:flex-row w-full gap-2 sm:gap-3 md:gap-4 xl:gap-6 items-stretch xl:items-start p-2.5 sm:p-4 md:p-5 xl:p-6">
      {/* Left Sidebar */}
      <div className="w-full xl:w-64 xl:flex-shrink-0 bg-white rounded-lg border border-secondary-200 shadow-sm overflow-hidden">
        <ProductSidebar
          categories={categories}
          onAddCategory={canEdit ? () => setIsCreating(true) : undefined}
          productCounts={productCounts}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onReorderCategories={canEdit ? reorderCategories : undefined}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-lg border border-secondary-200 shadow-sm p-3 sm:p-4 md:p-5 xl:p-6 min-h-[420px] md:min-h-[480px] xl:min-h-[600px]">
        {isCreating && (
          <CreateProductCategoryForm
            categoriesCount={categories.length}
            onCreateCategory={handleCreateCategory}
            onCancel={() => setIsCreating(false)}
          />
        )}

        {isLoading ? (
          <ProductListContentSkeleton />
        ) : categories.length === 0 ? (
          <EmptyState
            message={t('noProducts')}
            size="lg"
            bordered
            action={
              canEdit ? (
                <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" /> {t('addProductCategory')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-5 md:space-y-6 xl:space-y-8">
            {displayCategories.map((category) => (
              <ProductCategoryItem
                key={category.id}
                category={category}
                onDelete={canDelete ? handleDeleteCategory : undefined}
                onEdit={canEdit ? handleStartEditCategory : undefined}
                isEditing={editingCategoryId === category.id}
                editName={editCategoryName}
                onEditNameChange={setEditCategoryName}
                onSaveEdit={handleSaveCategory}
                onCancelEdit={() => setEditingCategoryId(null)}
              >
                <ProductItems
                  salonId={salonId}
                  categoryId={category.id}
                  products={allProducts.filter((p) => p.category_id === category.id)}
                  editingProductId={editingProductId}
                  editProductData={editProductData}
                  onEditProduct={canEdit ? handleStartEditProduct : undefined}
                  onEditProductDataChange={setEditProductData}
                  onSaveProduct={handleSaveProduct}
                  onCancelEditProduct={() => setEditingProductId(null)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              </ProductCategoryItem>
            ))}

            {/* Uncategorized products */}
            {!selectedCategoryId && (() => {
              const uncategorized = allProducts.filter(
                (p) => !p.category_id || !categories.find((c) => c.id === p.category_id)
              );
              if (uncategorized.length === 0) return null;
              return (
                <div className="space-y-3 md:space-y-4">
                  <div className="text-xs sm:text-sm font-semibold text-secondary-500">
                    {t('uncategorized')}
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    {uncategorized.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between py-2.5 md:py-3 px-3 md:px-4 bg-secondary-50 rounded-lg"
                      >
                        <div className="flex-1 text-sm md:text-base font-semibold text-secondary-900">
                          {product.name}
                        </div>
                        <div className="text-sm md:text-base font-semibold text-secondary-900">
                          {formatPrice(product.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
