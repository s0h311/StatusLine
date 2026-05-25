import { createFileRoute } from '@tanstack/react-router'
import { StatusLookup } from '../components/StatusLookup'

export const Route = createFileRoute('/embed')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: (search.code as string) ?? '',
  }),
  component: EmbedPage,
})

function EmbedPage() {
  const { code } = Route.useSearch()
  return <StatusLookup code={code} />
}
