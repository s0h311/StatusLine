import { createMiddleware, createServerFn } from '@tanstack/react-start'

const requestSessionMiddleware = createMiddleware({ type: 'request' }).server(async ({ request, next }) => {
  const { auth } = await import('../../infrastructure/Auth/auth')
  const session = await auth.api.getSession({ headers: request.headers })
  return next({ context: { session } })
})

export const getSessionAction = createServerFn({ method: 'GET' })
  .middleware([requestSessionMiddleware])
  .handler(({ context }) => {
    return context.session
  })
