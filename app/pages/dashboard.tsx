import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSessionAction } from '../../server/api/actions/auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getSessionAction()
    if (!session) {
      throw redirect({ to: '/anmelden' })
    }
    return { session }
  },
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
    </div>
  )
}
