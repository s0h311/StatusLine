import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { db } from '../../infrastructure/Database/client'
import { createOrderModule } from '../../domain/Order'
import { createDrizzleOrderStore } from '../../domain/OrderStore'
import { createDrizzleStatusStore } from '../../domain/StatusSequenceStore'
import { createStatusSequence } from '../../domain/StatusSequence'
import { sendMail } from '../../infrastructure/Mail/client'
import { EMAIL_FOOTER } from '../../infrastructure/Mail/consts'
import { getBaseUrl } from '../../infrastructure/Utils/getBaseUrl'
import { eq } from 'drizzle-orm'
import { user } from '../../infrastructure/Database/schemas/auth'

const orderStore = createDrizzleOrderStore(db)
const statusStore = createDrizzleStatusStore(db)
const statusSequence = createStatusSequence(statusStore)

const orderModule = createOrderModule({
  orderStore,
  getStatuses: (userId) => statusSequence.getStatuses(userId),
  getShopName: async (userId) => {
    const result = await db.select({ name: user.name }).from(user).where(eq(user.id, userId))
    return result[0]?.name ?? 'StatusLine'
  },
  sendOrderCreatedEmail: async ({ customerEmail, customerName, referenceCode, shopName }) => {
    const baseUrl = getBaseUrl()
    const statusUrl = `${baseUrl}/status?code=${referenceCode}`

    await sendMail({
      recipients: [customerEmail],
      subject: `${shopName} – Ihr Auftrag (${referenceCode})`,
      text: `Hallo ${customerName},

${shopName} hat einen Auftrag für Sie erstellt.

Referenzcode: ${referenceCode}

Den aktuellen Status Ihres Auftrags können Sie jederzeit hier einsehen:
${statusUrl}

${EMAIL_FOOTER}`,
    })
  },
  sendStatusUpdateEmail: async ({ customerEmail, customerName, referenceCode, statusName, shopName }) => {
    const baseUrl = getBaseUrl()
    const statusUrl = `${baseUrl}/status?code=${referenceCode}`

    await sendMail({
      recipients: [customerEmail],
      subject: `${shopName} – Statusupdate (${referenceCode})`,
      text: `Hallo ${customerName},

${shopName} hat den Status Ihres Auftrags (${referenceCode}) aktualisiert: ${statusName}

Den aktuellen Status können Sie jederzeit hier einsehen:
${statusUrl}

${EMAIL_FOOTER}`,
    })
  },
})

const authMiddleware = createMiddleware({ type: 'request' }).server(async ({ request, next }) => {
  const { auth } = await import('../../infrastructure/Auth/auth')
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) throw new Error('Nicht authentifiziert')
  return next({ context: { userId: session.user.id } })
})

export const getOrdersAction = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(({ context }) => orderModule.getOrders(context.userId))

export const lookupStatusAction = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => data as { referenceCode: string })
  .handler(({ data }) => orderModule.lookupOrderStatus(data.referenceCode))

export const createOrderAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => data as { customerName: string; customerEmail: string; note: string })
  .handler(({ context, data }) => orderModule.createOrder(context.userId, data))

export const advanceOrderAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => data as { orderId: string })
  .handler(({ context, data }) => orderModule.advanceOrder(context.userId, data.orderId))

export const revertOrderAction = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => data as { orderId: string })
  .handler(({ context, data }) => orderModule.revertOrder(context.userId, data.orderId))
