---
name: ui-design-token-guard
description: Enforce the salon-admin design system for colors, typography, spacing, radius, and component variants. Use when adding or refactoring UI in TSX/CSS files, especially for font, button, size, and style consistency across pages and features.
---

# UI Design Token Guard

## Overview
Use existing design tokens and shared UI components before introducing new styles. Keep visual behavior consistent across `src/app`, `src/components`, and `src/features`.

## Follow This Order
1. Read token sources first.
2. Reuse shared UI primitives.
3. Replace hardcoded styles.
4. Verify consistency with grep checks.

## Read These Files First
- `src/app/globals.css`
- `tailwind.config.js`
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Modal.tsx`

## Token And Component Rules
- Use semantic token classes (`primary`, `secondary`, `error`, `warning`, `success`, `info`) instead of raw Tailwind colors.
- Reuse `Button` variants (`primary`, `secondary`, `outline`, `ghost`, `danger`) before custom button classes.
- Reuse `Input`/`Select` error and helper patterns instead of local one-off form styles.
- Prefer shared spacing and radius scales (`rounded-lg`, `rounded-xl`, project token spacing) over arbitrary values.
- Keep root typographic scale aligned with project token sizes.

## Hardcoded Style Cleanup
Run this check before and after UI edits:

```bash
rg -n "text-gray-|bg-gray-|border-gray-|text-red-|bg-red-|border-red-|text-yellow-|bg-yellow-|border-yellow-" src
```

When matches exist in touched files:
- Replace with semantic token classes.
- If legacy screen intentionally differs, add a short code comment explaining why.

## Common Refactor Pattern
1. Keep structure and behavior unchanged.
2. Swap visual classes only.
3. Replace local buttons/inputs with shared UI primitives when safe.
4. Re-test hover/focus/disabled/error states.

## Done Criteria
- No new raw color utility classes introduced in changed files unless explicitly justified.
- Interactive controls use shared focus and disabled patterns.
- Button, input, and card styles match existing design language on desktop and mobile.
