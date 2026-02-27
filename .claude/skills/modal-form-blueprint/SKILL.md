---
name: modal-form-blueprint
description: Standardize modal form implementation for salon-admin using shared `Modal`, `ConfirmModal`, and UI input primitives. Use when creating or refactoring create/edit/delete flows that require validation, loading states, and confirmation dialogs.
---

# Modal Form Blueprint

## Overview
Build modal forms with a consistent UX contract: clear title, validated inputs, explicit loading state, safe close behavior, and optional destructive confirmation.

## Use This Component Stack
- `src/components/ui/Modal.tsx`
- `src/components/ui/ConfirmModal.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/ToastProvider.tsx`

## Build In This Order
1. Define modal props: `isOpen`, `onClose`, domain data, and `onSave`/`onConfirm` handlers.
2. Initialize local form state when opening.
3. Reset state when closing.
4. Validate inputs before submit.
5. Render footer actions with clear primary/secondary intent.
6. Add destructive action through `ConfirmModal`.

## State Lifecycle Rules
- Initialize state inside `useEffect` keyed by `isOpen` and source entity.
- Reset transient state on close to prevent stale values.
- Keep pending flags visible on buttons (`isLoading`, `disabled`).

## Validation And Feedback Rules
- Show inline field errors where possible.
- Prefer toast feedback for success/failure.
- Avoid `alert()` for normal product flows.

## Action Layout Rules
- Keep cancel on secondary style (`outline` or `ghost`).
- Keep submit on `primary` and destructive on `danger`.
- Disable submit when required inputs are missing.

## Confirmation Rules
- Trigger `ConfirmModal` only for destructive or irreversible actions.
- Keep confirm copy explicit (`delete`, `remove`, `cancel permanently`).

## Accessibility Rules
- Keep close button and backdrop close behavior explicit.
- Ensure keyboard escape closes the modal through shared `Modal` behavior.
- Provide clear labels and required markers on inputs.

## Done Criteria
- Open/edit/close/reopen cycles preserve correct state.
- Submit and delete paths show pending state and final feedback.
- Form visuals and button hierarchy match existing modals across features.
