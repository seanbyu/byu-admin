import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api';
import { Product, ProductCategory } from '../types';
import { productKeys, PRODUCTS_QUERY_OPTIONS, PRODUCT_CATEGORIES_QUERY_OPTIONS } from './queries';

const EMPTY_CATEGORIES: ProductCategory[] = [];
const EMPTY_PRODUCTS: Product[] = [];

// ─── Categories ───────────────────────────────────────

export function useProductCategories(salonId: string) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: productKeys.categories(salonId),
    queryFn: () => productsApi.getCategories(salonId),
    enabled: !!salonId,
    ...PRODUCT_CATEGORIES_QUERY_OPTIONS,
  });

  const createMutation = useMutation({
    mutationFn: ({ name, displayOrder }: { name: string; displayOrder: number }) =>
      productsApi.createCategory(salonId, name, displayOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories(salonId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      productsApi.updateCategory(salonId, id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories(salonId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteCategory(salonId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories(salonId) });
      queryClient.invalidateQueries({ queryKey: productKeys.list(salonId) });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (categories: { id: string; display_order: number }[]) =>
      productsApi.reorderCategories(salonId, categories),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.categories(salonId) });
    },
  });

  return {
    categories: data ?? EMPTY_CATEGORIES,
    isLoading,
    error,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    reorderCategories: reorderMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ─── Products ─────────────────────────────────────────

export function useProducts(salonId: string, categoryId?: string) {
  const queryClient = useQueryClient();

  const queryKey = categoryId
    ? productKeys.listByCategory(salonId, categoryId)
    : productKeys.list(salonId);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => productsApi.getProducts(salonId, categoryId),
    enabled: !!salonId,
    ...PRODUCTS_QUERY_OPTIONS,
  });

  const createMutation = useMutation({
    mutationFn: (params: { categoryId: string; name: string; price: number; displayOrder: number }) =>
      productsApi.createProduct(salonId, params.categoryId, {
        name: params.name,
        price: params.price,
        displayOrder: params.displayOrder,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list(salonId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      productsApi.updateProduct(salonId, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list(salonId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(salonId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list(salonId) });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (products: { id: string; display_order: number }[]) =>
      productsApi.reorderProducts(salonId, products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.list(salonId) });
    },
  });

  return {
    products: data ?? EMPTY_PRODUCTS,
    isLoading,
    error,
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    deleteProduct: deleteMutation.mutateAsync,
    reorderProducts: reorderMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
