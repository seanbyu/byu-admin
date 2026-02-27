---
name: i18n-3locale-sync
description: Keep Korean, English, and Thai translations synchronized for the salon-admin next-intl setup. Use when adding or changing copy in UI components, hooks, and validation messages so all locale message files stay aligned.
---

# I18N 3locale Sync

## Overview
Update translation keys across `ko`, `en`, and `th` together. Keep namespace structure stable and prevent locale drift when UI text changes.

## Locale Sources
- `src/messages/ko/*.json`
- `src/messages/en/*.json`
- `src/messages/th/*.json`
- `src/i18n/routing.ts`

## Update Workflow
1. Choose the target namespace file (`common`, `booking`, `staff`, `settings`, etc.).
2. Add or change the key in all 3 locale files in the same commit.
3. Keep object shape and key paths identical.
4. Use `useTranslations('<namespace>')` consistently in code.
5. Re-check affected screens in at least one non-default locale.

## Key Naming Rules
- Use dot-path style by domain and intent (`staff.createModal.title`).
- Keep shared actions in `common` when reusable (`save`, `cancel`, `confirm`).
- Avoid creating near-duplicate keys for the same UX intent.

## Coding Rules
- Avoid hardcoded UI text in TSX when translation is expected.
- Keep fallback literals for temporary debugging only; remove before merge.
- Keep validation and toast messages translated with the same key policy.

## Quick Checks
```bash
rg -n "useTranslations\(|t\('" src
```

```bash
rg -n "TODO_TRANSLATION|hardcoded|\balert\(" src
```

## Done Criteria
- New/changed keys exist in `ko`, `en`, and `th` with matching structure.
- Touched components use namespace-consistent translation access.
- No newly introduced hardcoded product copy remains in changed files.
