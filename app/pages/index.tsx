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
    <div className='flex flex-1 items-center justify-center px-4 py-8'>
      <div className='w-full max-w-lg'>
        <StatusLookup code={code} />
      </div>
    </div>
  )
}
