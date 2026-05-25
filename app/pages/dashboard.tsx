import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getSessionAction } from '../../server/api/actions/auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await getSessionAction()
    if (!session) {
      throw redirect({ to: '/anmelden' })
    }
    return { session }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return <Outlet />
}
