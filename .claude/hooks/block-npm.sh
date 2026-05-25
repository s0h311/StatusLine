#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

if echo "$COMMAND" | grep -qE '(^|&&|\|\||;)\s*npm(\s|$)'; then
  echo "Blocked: use 'pnpm' instead of 'npm' (per project rules)" >&2
  exit 2
fi

exit 0
