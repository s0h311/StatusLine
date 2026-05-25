#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

if echo "$COMMAND" | grep -qE '(^|&&|\|\||;)\s*git push(\s|$)'; then
  echo "Blocked: git push is not allowed per project rules" >&2
  exit 2
fi

exit 0
