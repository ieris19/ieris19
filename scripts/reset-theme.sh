#!/usr/bin/env bash
# Hard-resets the current branch to `content`, regenerates badges for the
# given theme, and commits them as the branch's single publish commit.
#
# Usage: scripts/reset-theme.sh <theme>

set -euo pipefail

theme="${1:?Usage: $(basename "$0") <theme>}"

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" = "content" ]; then
    echo "Refusing to run on 'content': checkout the publish branch first." >&2
    exit 1
fi

git reset --hard content

(cd badge-generator && npm run "generate:${theme}")

git add -f assets/badges
git commit -m "Added images for ${theme}"
