import { createFileRoute, Link } from '@tanstack/react-router'
import { StatusLookup } from '../components/StatusLookup'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => ({
    code: (search.code as string) ?? '',
  }),
  component: HomePage,
})

function HomePage() {
  const { code } = Route.useSearch()
  return (
    <div className='flex min-h-screen flex-col'>
      <header className='flex items-center justify-between border-b px-6 py-4'>
        <h1 className='text-lg font-bold'>StatusLine</h1>
        <Link to='/sign-in'>
          <Button size='sm'>Anmelden für Geschäfte</Button>
        </Link>
      </header>

      <div className='flex flex-1 items-center justify-center px-4 py-8'>
        <div className='w-full max-w-lg'>
          <StatusLookup code={code} />
        </div>
      </div>
    </div>
  )
}
