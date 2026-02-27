export const productKeys = {
  all: ['products'] as const,
  categories: (salonId: string) => [...productKeys.all, 'categories', salonId] as const,
  list: (salonId: string) => [...productKeys.all, 'list', salonId] as const,
  listByCategory: (salonId: string, categoryId: string) =>
    [...productKeys.list(salonId), categoryId] as const,
};

export const PRODUCTS_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  refetchOnWindowFocus: false,
  retry: 2,
} as const;

export const PRODUCT_CATEGORIES_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 10,
  gcTime: 1000 * 60 * 60,
  refetchOnWindowFocus: false,
  retry: 2,
} as const;
