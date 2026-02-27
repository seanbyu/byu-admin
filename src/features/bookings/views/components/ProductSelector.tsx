'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useTranslations } from 'next-intl';
import { useProductCategories, useProducts } from '@/features/products/hooks/useProducts';
import { Product } from '@/features/products/types';
import { cn, formatPrice } from '@/lib/utils';

interface ProductSelectorProps {
  salonId: string;
  selectedProductIds: string[];
  onProductAdd: (productId: string) => void;
}

function ProductSelectorComponent({
  salonId,
  selectedProductIds,
  onProductAdd,
}: ProductSelectorProps) {
  const t = useTranslations('product');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const { categories, isLoading: isCategoriesLoading } = useProductCategories(salonId);
  const { products, isLoading: isProductsLoading } = useProducts(salonId);

  // 카테고리별 제품 그룹화
  const productsByCategory = useMemo(() => {
    if (!products || products.length === 0) return {};
    return products
      .filter((p) => p.is_active)
      .reduce((acc, product) => {
        const catId = product.category_id || '_uncategorized';
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(product);
        return acc;
      }, {} as Record<string, Product[]>);
  }, [products]);

  // 제품이 있는 카테고리만 필터링
  const visibleCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((cat) => productsByCategory[cat.id]?.length > 0);
  }, [categories, productsByCategory]);

  // 첫 번째 카테고리 자동 선택
  useMemo(() => {
    if (!selectedCategoryId && visibleCategories.length > 0) {
      setSelectedCategoryId(visibleCategories[0].id);
    }
  }, [visibleCategories, selectedCategoryId]);

  // 현재 선택된 카테고리의 제품 목록
  const currentProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return productsByCategory[selectedCategoryId] || [];
  }, [selectedCategoryId, productsByCategory]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const handleProductClick = useCallback((productId: string) => {
    onProductAdd(productId);
  }, [onProductAdd]);

  const selectedCounts = useMemo(
    () =>
      selectedProductIds.reduce<Record<string, number>>((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {}),
    [selectedProductIds]
  );

  if (isCategoriesLoading || isProductsLoading) {
    return (
      <div className="border border-secondary-200 rounded-lg p-4 text-center text-secondary-600 bg-white">
        Loading...
      </div>
    );
  }

  if (visibleCategories.length === 0) {
    return (
      <div className="border border-secondary-200 rounded-lg p-4 text-center text-secondary-600 bg-white">
        {t('noProducts')}
      </div>
    );
  }

  return (
    <div className="border border-secondary-200 rounded-lg overflow-hidden bg-white">
      <div className="flex h-[240px]">
        {/* 카테고리 목록 (왼쪽) */}
        <div className="w-1/3 border-r border-secondary-200 overflow-y-auto bg-secondary-50">
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                'w-full px-4 py-3 text-left text-sm font-medium transition-colors border-l-2',
                selectedCategoryId === category.id
                  ? 'bg-primary-100 text-primary-700 border-l-primary-500'
                  : 'bg-white text-secondary-800 border-l-transparent hover:bg-secondary-50'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* 제품 목록 (오른쪽) */}
        <div className="w-2/3 overflow-y-auto">
          {currentProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleProductClick(product.id)}
              className={cn(
                'w-full px-4 py-3 text-left border-b border-secondary-100 last:border-b-0 transition-colors',
                (selectedCounts[product.id] || 0) > 0
                  ? 'bg-primary-100'
                  : 'hover:bg-secondary-50'
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-sm font-medium',
                    (selectedCounts[product.id] || 0) > 0
                      ? 'text-primary-700'
                      : 'text-secondary-800'
                  )}
                >
                  {product.name}
                </span>
                <div className="flex items-center gap-2">
                  {(selectedCounts[product.id] || 0) > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-xs font-semibold text-white">
                      x{selectedCounts[product.id]}
                    </span>
                  )}
                  <span className="text-xs text-secondary-600">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const ProductSelector = memo(ProductSelectorComponent);
export default ProductSelector;
