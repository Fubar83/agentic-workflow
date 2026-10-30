#!/usr/bin/env bash
# wag start-profile step: write FEATURE.md at the root of the feature folder,
# so every agent and skill can discover the Jira key, branch and repos without
# being told. Safe to re-run; it preserves the Jira key and creation date.
#
# Prints nothing on stdout: wag's own output is a path that `cd "$(wag …)"`
# consumes, and anything else here would corrupt it.
set -euo pipefail

dir="${WAG_FEATURE_DIR:-$PWD}"
file="$dir/FEATURE.md"
feature="${WAG_FEATURE:-$(basename "$dir")}"
branch="${WAG_BRANCH:-$feature}"

# feature-vfs-1234 -> VFS-1234; empty when the name carries no key
key="$(printf '%s\n' "$feature" | grep -oiE '[a-z][a-z0-9]+-[0-9]+' | head -n1 | tr '[:lower:]' '[:upper:]' || true)"
created="$(date +%F)"

# keep what a previous run, the planner, or you filled in by hand
if [ -f "$file" ]; then
  [ -n "$key" ] || key="$(sed -n 's/^jira:[[:space:]]*//p' "$file" | head -n1)"
  prev_created="$(sed -n 's/^created:[[:space:]]*//p' "$file" | head -n1)"
  [ -z "$prev_created" ] || created="$prev_created"
fi

mapfile -t repos <<< "${WAG_REPOS:-}"
mapfile -t trees <<< "${WAG_WORKTREES:-}"

# a single-repo call sets WAG_REPO/WAG_WORKTREE instead
if [ -z "${repos[0]:-}" ] && [ -n "${WAG_REPO:-}" ]; then
  repos=("$WAG_REPO")
  trees=("${WAG_WORKTREE:-}")
fi

{
  printf '# %s\n\n' "$feature"
  printf 'Written by wag when the feature folder was created.\n'
  printf 'The plan for this work lives in `.working-docs/`.\n\n'
  printf '```yaml\n'
  printf 'feature: %s\n' "$feature"
  printf 'branch: %s\n' "$branch"
  printf 'jira: %s\n' "$key"
  printf 'created: %s\n' "$created"
  printf 'repos:\n'
  for i in "${!repos[@]}"; do
    name="${repos[$i]}"
    [ -n "$name" ] || continue
    printf '  - name: %s\n    path: %s\n' "$name" "${trees[$i]:-}"
  done
  printf '```\n'
} > "$file.tmp" && mv "$file.tmp" "$file"

printf 'feature-manifest: wrote %s\n' "$file" >&2
