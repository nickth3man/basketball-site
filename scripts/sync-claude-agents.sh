#!/bin/bash

# =============================================================================
# sync-claude-agents.sh
# =============================================================================
#
# Keeps CLAUDE.md and AGENTS.md in sync across the repository.
# In each directory that contains either file, the more recently modified
# file overwrites the other.
#
# Usage (from repo root):
#   bash scripts/sync-claude-agents.sh
#
# =============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Cross-platform modification time (GNU stat on Linux/Git Bash; BSD stat on macOS)
get_mtime() {
    if stat --version 2>/dev/null | grep -q GNU; then
        stat -c %Y "$1"
    else
        stat -f %m "$1"
    fi
}

sync_pair() {
    local dir="$1"
    local claude="$dir/CLAUDE.md"
    local agents="$dir/AGENTS.md"

    if [ -f "$claude" ] && [ -f "$agents" ]; then
        local claude_mtime agents_mtime
        claude_mtime=$(get_mtime "$claude")
        agents_mtime=$(get_mtime "$agents")

        if [ "$claude_mtime" -gt "$agents_mtime" ]; then
            cp "$claude" "$agents"
            echo "  Updated AGENTS.md from CLAUDE.md in ${dir#"$REPO_ROOT/"}"
        elif [ "$agents_mtime" -gt "$claude_mtime" ]; then
            cp "$agents" "$claude"
            echo "  Updated CLAUDE.md from AGENTS.md in ${dir#"$REPO_ROOT/"}"
        else
            echo "  Already in sync: ${dir#"$REPO_ROOT/"}"
        fi

    elif [ -f "$claude" ]; then
        cp "$claude" "$agents"
        echo "  Created AGENTS.md from CLAUDE.md in ${dir#"$REPO_ROOT/"}"

    elif [ -f "$agents" ]; then
        cp "$agents" "$claude"
        echo "  Created CLAUDE.md from AGENTS.md in ${dir#"$REPO_ROOT/"}"
    fi
}

echo "Syncing CLAUDE.md <-> AGENTS.md across repository..."
echo ""

# Collect unique directories containing CLAUDE.md or AGENTS.md,
# excluding noisy generated/dependency directories.
mapfile -t dirs < <(
    find "$REPO_ROOT" \( -name "CLAUDE.md" -o -name "AGENTS.md" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/.next/*" \
        -not -path "*/.git/*" \
        | xargs -I{} dirname {} \
        | sort -u
)

for dir in "${dirs[@]}"; do
    sync_pair "$dir"
done

echo ""
echo "Done."
