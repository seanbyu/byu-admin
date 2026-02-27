#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLAUDE_DIR="$ROOT_DIR/.claude/skills"
CODEX_DIR="$ROOT_DIR/skills"

if [[ -d "$CLAUDE_DIR" ]]; then
  TARGET_DIR="$CLAUDE_DIR"
else
  TARGET_DIR="$CODEX_DIR"
fi

if [[ ! -d "$TARGET_DIR" ]]; then
  echo "Skills directory not found: $TARGET_DIR" >&2
  exit 1
fi

query="${*:-}"

if [[ -z "$query" ]]; then
  echo "Skills in: $TARGET_DIR"
  find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort
  echo
  echo "Usage: pnpm cskills <keyword>"
  exit 0
fi

echo "Search target: $TARGET_DIR"
echo "Keyword: $query"
echo
echo "[Name matches]"
find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -type d -iname "*$query*" -exec basename {} \; | sort || true
echo
echo "[Content matches]"
if command -v rg >/dev/null 2>&1; then
  rg -n -i --glob '*/SKILL.md' -- "$query" "$TARGET_DIR" || true
else
  grep -RIn --include='SKILL.md' -- "$query" "$TARGET_DIR" || true
fi
