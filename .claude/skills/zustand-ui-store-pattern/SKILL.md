---
name: zustand-ui-store-pattern
description: Apply the salon-admin Zustand architecture for UI-only state such as modal visibility, selected rows, filters, and local view controls. Use when creating or refactoring feature stores, selectors, and shallow hooks while keeping server data in React Query.
---

# Zustand UI Store Pattern

## Overview
Keep Zustand focused on UI state only. Store modal state, selected entities, and view preferences in feature stores while leaving fetched server data in TanStack Query.

## Build In This Order
1. Define `State`, `Actions`, and merged `Store` types.
2. Create `initialState`.
3. Create store with `create(...)` and `devtools(...)`.
4. Export selectors for atomic subscriptions.
5. Export shallow action/state hooks for stable renders.

## Store Design Rules
- Keep state serializable where possible.
- Keep action names explicit (`openXModal`, `closeXModal`, `setSelectedY`, `reset`).
- Provide `reset` for page teardown or logout transitions.
- Avoid placing asynchronous server fetch logic in the store.

## Selector Rules
- Export single-purpose selectors (`selectShowInviteModal`, `selectSelectedStaff`).
- Use `useShallow` for grouped hooks returning multiple values.
- Use atomic selectors when only one value is needed.

## Minimal Template
```ts
interface FeatureUIState {
  showModal: boolean;
  selectedId: string | null;
}

interface FeatureUIActions {
  openModal: () => void;
  closeModal: () => void;
  setSelectedId: (id: string | null) => void;
  reset: () => void;
}
```

## Integration Rules
- Combine with React Query in feature hooks, not in store files.
- Use store actions in components for view control only.
- Keep mutation/query status from hooks instead of duplicating flags in store.

## Done Criteria
- UI interactions work without unnecessary rerenders.
- Store actions are easy to inspect in devtools.
- No duplicated server state is persisted in Zustand.
