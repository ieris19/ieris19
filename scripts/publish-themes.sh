#!/usr/bin/env bash
# Rebuilds every publish branch via reset-theme.sh, then force-pushes each
# to its configured upstream, but only if the resulting commit's diff
# against `content` is confined to assets/badges/. Anything else touched
# bypasses the push.
#
# Usage: scripts/publish-themes.sh

set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

declare -A themes=(
    [prime/ierislabs]=forgejo
    [prime/github]=github
    [prime/codeberg]=codeberg
)

for branch in "${!themes[@]}"; do
    theme="${themes[$branch]}"
    echo "== ${branch} (${theme}) =="

    git checkout "$branch"
    scripts/reset-theme.sh "$theme"

    changed=$(git diff --name-only content HEAD)
    offending=$(printf '%s\n' "$changed" | grep -v '^assets/badges/' || true)
    if [ -n "$offending" ]; then
        echo "Refusing to push ${branch}: commit touches files outside assets/badges/:" >&2
        echo "$offending" >&2
        exit 1
    fi

    if ! upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null); then
        echo "No upstream configured for ${branch}; run 'git push -u <remote> ${branch}:<remote-branch>' once first." >&2
        exit 1
    fi
    remote="${upstream%%/*}"
    remote_branch="${upstream#*/}"

    echo "Pushing ${branch} -> ${remote}/${remote_branch}"
    git push --force-with-lease "$remote" "HEAD:${remote_branch}"
done

git checkout content