#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

STRICT_MODE=false
if [[ "${1:-}" == "--strict" ]]; then
  STRICT_MODE=true
fi

RAW_COLOR_PATTERN="\\b(?:text|bg|border|ring|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\\b"
RAW_COLOR_GLOB='*.{ts,tsx,js,jsx}'
NATIVE_CONTROL_PATTERN='<(input|select|textarea)\b[^>]*className='
MAX_PREVIEW_LINES=80
RAW_COLOR_RESULT_FILE="$(mktemp)"
NATIVE_CONTROL_RESULT_FILE="$(mktemp)"

cleanup() {
  rm -f "$RAW_COLOR_RESULT_FILE" "$NATIVE_CONTROL_RESULT_FILE"
}
trap cleanup EXIT

has_violation=false

echo "[1/2] Raw Tailwind palette usage"
if rg -n --pcre2 --glob "$RAW_COLOR_GLOB" -- "$RAW_COLOR_PATTERN" src > "$RAW_COLOR_RESULT_FILE"; then
  has_violation=true
  raw_count="$(wc -l < "$RAW_COLOR_RESULT_FILE" | tr -d ' ')"
  echo "  Violations: $raw_count (showing first $MAX_PREVIEW_LINES)"
  sed -n "1,${MAX_PREVIEW_LINES}p" "$RAW_COLOR_RESULT_FILE"
else
  echo "  OK"
fi

echo
echo "[2/2] Styled native form controls (prefer ui primitives)"
if rg -n --pcre2 --multiline --multiline-dotall \
  --glob '*.tsx' \
  --glob '!src/components/ui/**' \
  -- "$NATIVE_CONTROL_PATTERN" src > "$NATIVE_CONTROL_RESULT_FILE"; then
  has_violation=true
  native_count="$(wc -l < "$NATIVE_CONTROL_RESULT_FILE" | tr -d ' ')"
  echo "  Violations: $native_count (showing first $MAX_PREVIEW_LINES)"
  sed -n "1,${MAX_PREVIEW_LINES}p" "$NATIVE_CONTROL_RESULT_FILE"
else
  echo "  OK"
fi

echo
if [[ "$has_violation" == true ]]; then
  echo "Design-system check found violations."
  if [[ "$STRICT_MODE" == true ]]; then
    echo "Strict mode enabled: exiting with failure."
    exit 1
  fi
  echo "Non-strict mode: exiting with success."
  exit 0
fi

echo "Design-system check passed."
