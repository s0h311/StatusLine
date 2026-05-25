export type Order = {
  id: string
  userId: string
  customerName: string
  customerEmail: string
  note: string
  referenceCode: string
  currentStatusId: string
  createdAt: Date
}

export type OrderWithStatus = Order & { statusName: string }

export type StatusProgress = {
  statuses: { name: string; position: number }[]
  currentStatusName: string
  currentPosition: number
}

export type OrderStore = {
  insert(data: Omit<Order, 'id' | 'createdAt'>): Promise<Order>
  existsByReferenceCode(code: string): Promise<boolean>
  getByUserId(userId: string): Promise<Order[]>
  getByReferenceCode(code: string): Promise<Order | null>
}

export type OrderDeps = {
  orderStore: OrderStore
  getStatuses: (userId: string) => Promise<{ id: string; position: number; name: string }[]>
  sendOrderCreatedEmail: (params: {
    customerEmail: string
    customerName: string
    referenceCode: string
  }) => Promise<void>
  generateReferenceCode?: () => string
}

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const CODE_LENGTH = 6

export function defaultGenerateReferenceCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

const MAX_RETRIES = 10

export function createOrderModule(deps: OrderDeps) {
  const generate = deps.generateReferenceCode ?? defaultGenerateReferenceCode

  return {
    async createOrder(
      userId: string,
      input: { customerName: string; customerEmail: string; note: string },
    ): Promise<Order> {
      const statuses = await deps.getStatuses(userId)
      if (statuses.length === 0) throw new Error('Keine Status vorhanden')

      const firstStatus = statuses.toSorted((a, b) => a.position - b.position)[0]
      if (!firstStatus) throw new Error('Keine Status vorhanden')

      let referenceCode: string = ''
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const candidate = generate()
        const exists = await deps.orderStore.existsByReferenceCode(candidate)
        if (!exists) {
          referenceCode = candidate
          break
        }
      }
      if (!referenceCode) throw new Error('Referenzcode konnte nicht generiert werden')

      const order = await deps.orderStore.insert({
        userId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        note: input.note,
        referenceCode,
        currentStatusId: firstStatus.id,
      })

      await deps.sendOrderCreatedEmail({
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        referenceCode,
      })

      return order
    },

    async lookupOrderStatus(referenceCode: string): Promise<StatusProgress | null> {
      const order = await deps.orderStore.getByReferenceCode(referenceCode)
      if (!order) return null

      const statuses = await deps.getStatuses(order.userId)
      const sorted = statuses.toSorted((a, b) => a.position - b.position)
      const current = sorted.find((s) => s.id === order.currentStatusId)

      return {
        statuses: sorted.map((s) => ({ name: s.name, position: s.position })),
        currentStatusName: current?.name ?? 'Unbekannt',
        currentPosition: current?.position ?? -1,
      }
    },

    async getOrders(userId: string): Promise<OrderWithStatus[]> {
      const [orders, statuses] = await Promise.all([deps.orderStore.getByUserId(userId), deps.getStatuses(userId)])
      const statusMap = new Map(statuses.map((s) => [s.id, s.name]))
      return orders.map((o) => ({
        ...o,
        statusName: statusMap.get(o.currentStatusId) ?? 'Unbekannt',
      }))
    },
  }
}
