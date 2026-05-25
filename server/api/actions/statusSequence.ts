import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { db } from '../../infrastructure/Database/client'
import { createStatusSequence } from '../../domain/StatusSequence'
import { createDrizzleStatusStore } from '../../domain/StatusSequenceStore'

const store = createDrizzleStatusStore(db)
const statusSequence = createStatusSequence(store)

const authMiddleware = createMiddleware({ type: 'request' }).server(async ({ request, next }) => {
  const { auth } = await import('../../infrastructure/Auth/auth')
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Nicht authentifiziert')
  return next({ context: { userId: session.user.id } })
})

export const getStatusesAction = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(({ context }) => statusSequence.getStatuses(context.userId))

export const addStatusAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => data as { name: string; position?: number })
  .handler(({ context, data }) => statusSequence.addStatus(context.userId, data))

export const removeStatusAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => data as { statusId: string })
  .handler(({ context, data }) => statusSequence.removeStatus({ id: data.statusId, userId: context.userId }))

export const reorderStatusesAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => data as { statusIds: string[] })
  .handler(({ context, data }) => statusSequence.reorderStatuses(context.userId, data.statusIds))

export const toggleNotifyAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => data as { statusId: string })
  .handler(({ context, data }) => statusSequence.toggleNotify({ id: data.statusId, userId: context.userId }))
