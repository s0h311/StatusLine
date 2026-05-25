#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

if echo "$COMMAND" | grep -qE '(^|&&|\|\||;|\s)eslint(\s|$)'; then
  echo '{"continue": false, "stopReason": "Use '\''pnpm run lint'\'' (oxlint) instead of eslint directly."}'
  exit 0
fi

exit 0
