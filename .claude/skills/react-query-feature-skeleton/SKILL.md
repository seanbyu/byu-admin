---
name: react-query-feature-skeleton
description: Build and refactor feature data layers using the salon-admin TanStack Query v5 pattern. Use when creating or modifying feature `api.ts`, `hooks/queries.ts`, and `hooks/use*.ts` files with query keys, query options, mutations, and cache invalidation.
---

# React Query Feature Skeleton

## Overview
Implement feature data access with a repeatable 3-file structure: `api.ts`, `hooks/queries.ts`, and `hooks/useFeature.ts`. Keep query keys stable and invalidation predictable.

## Target Structure
- `src/features/<feature>/api.ts`
- `src/features/<feature>/hooks/queries.ts`
- `src/features/<feature>/hooks/use<Feature>.ts`

## Build In This Order
1. Define key factories and default query options in `queries.ts`.
2. Define API wrapper functions in `api.ts`.
3. Implement consumer hooks in `use<Feature>.ts` with `useQuery`, `useMutation`, `useQueryClient`.
4. Return memoized data and mutation helpers.

## Query Key Rules
- Define `all`, `lists`, `list(...)`, `details`, `detail(...)` style factories.
- Include identifiers (`salonId`, `id`, filters) explicitly in keys.
- Reuse key factories for invalidation; do not inline ad-hoc key arrays in multiple files.

## Query Options Rules
- Keep stale/gc/retry/refetch behavior centralized per feature.
- Use `enabled` guards for required IDs.
- Use `select` to normalize response shape close to data source.

## Mutation Rules
- Use `onSuccess` to invalidate relevant keys.
- Use optimistic updates only when clear UX benefit exists and rollback path is defined.
- Expose async mutation helpers (for example `createItem`, `updateItem`) from the feature hook.

## Hook Return Rules
- Return `data`, normalized collection aliases, loading flags, and mutation pending flags.
- Use `useMemo`/`useCallback` for stable return contracts.
- Avoid storing server data in Zustand. Keep server state in React Query.

## Minimal Template
```ts
export const featureKeys = {
  all: ['feature'] as const,
  lists: () => [...featureKeys.all, 'list'] as const,
  list: (salonId: string) => [...featureKeys.lists(), salonId] as const,
};
```

## Pre-merge Checks
```bash
rg -n "queryKey:|invalidateQueries|useMutation\(|useQuery\(" src/features/<feature>
```

Verify:
- Key factory usage is consistent.
- Invalidations target the same key hierarchy.
- No duplicated query key literals for the same data.
