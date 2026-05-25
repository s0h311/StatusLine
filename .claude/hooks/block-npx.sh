#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

if echo "$COMMAND" | grep -qE '(^|&&|\|\||;)\s*npx(\s|$)'; then
  echo "Blocked: use 'pnpm exec or pnpm dlx' instead of 'npx' (per project rules)" >&2
  exit 2
fi

exit 0
