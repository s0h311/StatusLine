import { Outlet, createFileRoute, redirect, Link, useLocation } from '@tanstack/react-router'
import { Plus, ListOrdered, GitBranch, LogOut } from 'lucide-react'
import { authClient } from '@/libs/authClient'
import { getSessionAction } from '../../server/api/actions/auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getSessionAction()
    if (!session) {
      throw redirect({ to: '/sign-in' })
    }
    return { session }
  },
  component: DashboardLayout,
})

const navItems = [
  { to: '/dashboard', label: 'Neuer Auftrag', icon: Plus, exact: true },
  { to: '/dashboard/orders', label: 'Aufträge', icon: ListOrdered, exact: false },
  { to: '/dashboard/status-sequence', label: 'Status-Sequenz', icon: GitBranch, exact: false },
] as const

function DashboardLayout() {
  const location = useLocation()

  function isActive(to: string, exact: boolean) {
    if (exact) return location.pathname === to || location.pathname === to + '/'
    return location.pathname.startsWith(to)
  }

  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = '/sign-in'
  }

  return (
    <div className='flex min-h-screen'>
      <aside className='border-r bg-muted/30 w-64 flex flex-col'>
        <div className='p-4 border-b'>
          <h1 className='font-bold text-lg'>StatusLine</h1>
        </div>
        <nav className='flex-1 p-3 space-y-1'>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.to, item.exact)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className='h-4 w-4' />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className='p-3 border-t'>
          <button
            onClick={handleSignOut}
            className='flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors'
          >
            <LogOut className='h-4 w-4' />
            Abmelden
          </button>
        </div>
      </aside>
      <main className='flex-1 p-8'>
        <Outlet />
      </main>
    </div>
  )
}
