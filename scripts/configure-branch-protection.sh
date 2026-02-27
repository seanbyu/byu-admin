#!/usr/bin/env bash
set -euo pipefail

CHECK_CONTEXT="${CHECK_CONTEXT:-Design System / design-system-check}"
DEFAULT_BRANCHES=("main" "develop")
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  shift
fi

if [[ $# -gt 0 ]]; then
  BRANCHES=("$@")
else
  BRANCHES=("${DEFAULT_BRANCHES[@]}")
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is required."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required."
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh is not authenticated. Run: gh auth login"
  exit 1
fi

if [[ -n "${GITHUB_REPOSITORY:-}" ]]; then
  REPO="$GITHUB_REPOSITORY"
else
  REMOTE_URL="$(git remote get-url origin)"
  REPO="$(echo "$REMOTE_URL" | sed -E 's#^https://github.com/##; s#^git@github.com:##; s#\.git$##')"
fi

if [[ "$REPO" != */* ]]; then
  echo "Error: failed to resolve owner/repo from git remote."
  exit 1
fi

echo "Repository: $REPO"
echo "Required check: $CHECK_CONTEXT"
echo

FAILED=0

for BRANCH in "${BRANCHES[@]}"; do
  echo "==> Branch: $BRANCH"

  if ! EXISTING_RAW="$(gh api "repos/$REPO/branches/$BRANCH/protection/required_status_checks" 2>/dev/null)"; then
    echo "  Skipped: branch protection is not enabled or access is denied."
    echo "  Action: enable branch protection first, then re-run this script."
    FAILED=$((FAILED + 1))
    echo
    continue
  fi

  EXISTING_CONTEXTS_JSON="$(
    echo "$EXISTING_RAW" \
      | jq -c '[((.contexts // [])[]), ((.checks // [])[]?.context)] | map(select(type == "string" and length > 0)) | unique'
  )"
  MERGED_CONTEXTS_JSON="$(
    jq -cn \
      --argjson existing "$EXISTING_CONTEXTS_JSON" \
      --arg required "$CHECK_CONTEXT" \
      '$existing + [$required] | unique'
  )"

  PAYLOAD="$(
    jq -cn \
      --argjson contexts "$MERGED_CONTEXTS_JSON" \
      '{strict: true, contexts: $contexts}'
  )"

  if [[ "$DRY_RUN" == true ]]; then
    echo "  Dry run payload:"
    echo "$PAYLOAD" | jq .
  else
    gh api \
      --method PATCH \
      "repos/$REPO/branches/$BRANCH/protection/required_status_checks" \
      --input - <<<"$PAYLOAD" >/dev/null
    echo "  Updated required status checks."
  fi

  echo
done

if [[ "$FAILED" -gt 0 ]]; then
  echo "Completed with $FAILED skipped branch(es)."
  exit 1
fi

echo "Completed successfully."
