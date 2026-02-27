import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProducts } from '@/features/products/hooks/useProducts';
import { Booking } from '../../../types';
import { useMenuMap, useCategoryMap } from '../../../hooks/useMenuMaps';
import { useServiceGroups } from '../../../hooks/useServiceGroups';
import { PaymentMethod, DiscountType, SalesTab, CategoryPriceItem } from './types';

export function useSalesModalState(
  isOpen: boolean,
  booking: Booking | null
) {
  const { user } = useAuthStore();
  const salonId = user?.salonId || '';
  const { products: allProducts } = useProducts(salonId);
  const menuMap = useMenuMap(salonId);
  const categoryNameMap = useCategoryMap(salonId);

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [items, setItems] = useState<CategoryPriceItem[]>([]);
  const [productItems, setProductItems] = useState<CategoryPriceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<SalesTab>('service');
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);

  // 카테고리별 그룹 (서비스 선택 표시용)
  const {
    groups: selectedServiceGroups,
    totalDuration: totalServiceDuration,
  } = useServiceGroups(selectedServiceIds, menuMap, categoryNameMap);

  // 제품 맵 & 선택 제품 합계
  const productMap = useMemo(() => {
    const map: Record<string, { id: string; name: string; price: number }> = {};
    (allProducts || []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [allProducts]);

  const selectedProductGroups = useMemo(() => {
    const countMap = new Map<string, number>();
    selectedProductIds.forEach((id) => {
      countMap.set(id, (countMap.get(id) || 0) + 1);
    });
    return Array.from(countMap.entries())
      .map(([id, count]) => ({
        product: productMap[id],
        count,
        total: (productMap[id]?.price || 0) * count,
      }))
      .filter((g) => g.product);
  }, [selectedProductIds, productMap]);

  const productNameSummary = useMemo(
    () => selectedProductGroups.map((g) => g.product.name).join(', '),
    [selectedProductGroups]
  );

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen && booking && !isServiceInitialized) {
      const serviceIds = booking.bookingMeta?.service_ids;
      if (Array.isArray(serviceIds) && serviceIds.length > 0) {
        setSelectedServiceIds(serviceIds);
      } else if (booking.serviceId) {
        setSelectedServiceIds([booking.serviceId]);
      } else {
        setSelectedServiceIds([]);
      }

      setPaymentMethod((booking.paymentMethod as PaymentMethod) || '');
      const savedProductIds = booking.bookingMeta?.product_ids;
      setSelectedProductIds(Array.isArray(savedProductIds) ? savedProductIds : []);
      setNotes(booking.notes || '');
      setIsServiceInitialized(true);
    }

    if (!isOpen && isServiceInitialized) {
      setIsServiceInitialized(false);
      setSelectedServiceIds([]);
      setSelectedProductIds([]);
      setItems([]);
      setProductItems([]);
      setActiveTab('service');
    }
  }, [isOpen, booking, isServiceInitialized]);

  // selectedServiceIds 변경 → items 갱신 (기존 할인 설정 보존)
  useEffect(() => {
    if (!isServiceInitialized) return;

    setItems((prev) => {
      const prevMap = new Map(prev.map((item) => [item.categoryId, item]));

      return selectedServiceGroups.map((group) => {
        const existing = prevMap.get(group.categoryId);
        if (existing) {
          return { ...existing, price: String(group.totalPrice) };
        }
        return {
          categoryId: group.categoryId,
          categoryName: group.categoryName,
          price: String(group.totalPrice),
          showDiscount: false,
          discountType: 'percent' as DiscountType,
          discountValue: '',
        };
      });
    });
  }, [selectedServiceGroups, isServiceInitialized]);

  // selectedProductIds 변경 → productItems 갱신 (기존 할인 설정 보존)
  useEffect(() => {
    if (!isServiceInitialized) return;

    setProductItems((prev) => {
      const prevMap = new Map(prev.map((item) => [item.categoryId, item]));

      return selectedProductGroups.map((group) => {
        const existing = prevMap.get(group.product.id);
        if (existing) {
          return { ...existing, price: String(group.total) };
        }
        return {
          categoryId: group.product.id,
          categoryName: group.product.name,
          price: String(group.total),
          showDiscount: false,
          discountType: 'percent' as DiscountType,
          discountValue: '',
        };
      });
    });
  }, [selectedProductGroups, isServiceInitialized]);

  // 서비스 추가
  const handleServiceAdd = useCallback((serviceId: string) => {
    setSelectedServiceIds((prev) => [...prev, serviceId]);
  }, []);

  // 카테고리 그룹 전체 삭제
  const handleRemoveCategoryServices = useCallback(
    (categoryId: string) => {
      setSelectedServiceIds((prev) =>
        prev.filter((id) => menuMap[id]?.category_id !== categoryId)
      );
    },
    [menuMap]
  );

  // 제품 추가
  const handleProductAdd = useCallback((productId: string) => {
    setSelectedProductIds((prev) => [...prev, productId]);
  }, []);

  // 제품 그룹 삭제
  const handleRemoveProduct = useCallback((productId: string) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  }, []);

  // 아이템 업데이트 헬퍼
  const updateItem = useCallback(
    (index: number, updates: Partial<CategoryPriceItem>) => {
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const updateProductItem = useCallback(
    (index: number, updates: Partial<CategoryPriceItem>) => {
      setProductItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
      );
    },
    []
  );

  // 각 아이템의 할인 금액
  const itemDiscounts = useMemo(() => {
    return items.map((item) => {
      const base = Number(item.price) || 0;
      const val = Number(item.discountValue) || 0;
      if (val <= 0) return 0;
      if (item.discountType === 'percent') {
        return Math.round((base * Math.min(val, 100)) / 100);
      }
      return Math.min(val, base);
    });
  }, [items]);

  // 각 아이템의 최종 금액
  const itemFinalPrices = useMemo(() => {
    return items.map((item, i) => {
      const base = Number(item.price) || 0;
      return Math.max(base - itemDiscounts[i], 0);
    });
  }, [items, itemDiscounts]);

  // 시술 합계
  const totalServicePrice = useMemo(
    () => itemFinalPrices.reduce((sum, p) => sum + p, 0),
    [itemFinalPrices]
  );

  // 제품 할인 금액
  const productItemDiscounts = useMemo(() => {
    return productItems.map((item) => {
      const base = Number(item.price) || 0;
      const val = Number(item.discountValue) || 0;
      if (val <= 0) return 0;
      if (item.discountType === 'percent') {
        return Math.round((base * Math.min(val, 100)) / 100);
      }
      return Math.min(val, base);
    });
  }, [productItems]);

  // 제품 최종 금액
  const productItemFinalPrices = useMemo(() => {
    return productItems.map((item, i) => {
      const base = Number(item.price) || 0;
      return Math.max(base - productItemDiscounts[i], 0);
    });
  }, [productItems, productItemDiscounts]);

  // 제품 합계 (할인 적용)
  const totalProductAmount = useMemo(
    () => productItemFinalPrices.reduce((sum, p) => sum + p, 0),
    [productItemFinalPrices]
  );

  return {
    salonId,
    // 탭
    activeTab,
    setActiveTab,
    // 서비스
    selectedServiceIds,
    selectedServiceGroups,
    totalServiceDuration,
    handleServiceAdd,
    handleRemoveCategoryServices,
    // 서비스 가격
    items,
    itemDiscounts,
    itemFinalPrices,
    totalServicePrice,
    updateItem,
    // 제품
    selectedProductIds,
    selectedProductGroups,
    productNameSummary,
    handleProductAdd,
    handleRemoveProduct,
    // 제품 가격
    productItems,
    productItemDiscounts,
    productItemFinalPrices,
    totalProductAmount,
    updateProductItem,
    // 결제/메모
    paymentMethod,
    setPaymentMethod,
    notes,
    setNotes,
    // save에 필요한 맵
    menuMap,
    categoryNameMap,
  };
}
