#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="${1:-$ROOT_DIR/skills}"
DST_DIR="${2:-$ROOT_DIR/.claude/skills}"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Source directory not found: $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$DST_DIR"

# Remove stale Claude skills that no longer exist in source.
for dst_skill in "$DST_DIR"/*; do
  [[ -d "$dst_skill" ]] || continue
  skill_name="$(basename "$dst_skill")"
  if [[ ! -d "$SRC_DIR/$skill_name" ]]; then
    rm -rf "$dst_skill"
    echo "Removed stale Claude skill: $skill_name"
  fi
done

# Sync skill content (SKILL.md + optional scripts/references/assets).
for src_skill in "$SRC_DIR"/*; do
  [[ -d "$src_skill" ]] || continue
  [[ -f "$src_skill/SKILL.md" ]] || continue

  skill_name="$(basename "$src_skill")"
  dst_skill="$DST_DIR/$skill_name"

  rm -rf "$dst_skill"
  mkdir -p "$dst_skill"
  cp "$src_skill/SKILL.md" "$dst_skill/SKILL.md"

  for resource_dir in scripts references assets; do
    if [[ -d "$src_skill/$resource_dir" ]]; then
      cp -R "$src_skill/$resource_dir" "$dst_skill/$resource_dir"
    fi
  done

  echo "Synced Claude skill: $skill_name"
done

echo "Claude skills sync complete: $DST_DIR"
