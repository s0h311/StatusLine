import { createFileRoute } from '@tanstack/react-router'
import { StatusLookup } from '../components/StatusLookup'

export const Route = createFileRoute('/status')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: (search.code as string) ?? '',
  }),
  component: StatusPage,
})

function StatusPage() {
  const { code } = Route.useSearch()
  return (
    <StatusLookup
      code={code}
      showHeader={false}
    />
  )
}
