import { Link } from '@tanstack/react-router'
import { Button } from './ui/button'
import { cn } from '../libs/utils.ts'

export function Navbar({ className }: { className?: string }) {
  return (
    <header className={cn(className, 'flex items-center justify-between border-b px-6 py-4')}>
      <Link
        to='/'
        search={{ code: '' }}
      >
        <h1 className='text-lg font-bold'>StatusLine</h1>
      </Link>

      <Link to='/sign-in'>
        <Button size='sm'>Anmelden für Geschäfte</Button>
      </Link>
    </header>
  )
}
