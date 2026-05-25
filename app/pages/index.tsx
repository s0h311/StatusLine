import { createFileRoute } from '@tanstack/react-router'
import { StatusLookup } from '../components/StatusLookup'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: (search.code as string) ?? '',
  }),
  component: HomePage,
})

function HomePage() {
  const { code } = Route.useSearch()
  return (
    <StatusLookup
      code={code}
      showHeader
    />
  )
}
