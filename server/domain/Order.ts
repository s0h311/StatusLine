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
  getById(id: string): Promise<Order | null>
  updateCurrentStatus(id: string, currentStatusId: string): Promise<Order>
  remove(id: string): Promise<void>
}

export type OrderDeps = {
  orderStore: OrderStore
  getStatuses: (userId: string) => Promise<{ id: string; position: number; name: string; notify: boolean }[]>
  sendOrderCreatedEmail: (params: {
    customerEmail: string
    customerName: string
    referenceCode: string
    shopName: string
  }) => Promise<void>
  sendStatusUpdateEmail: (params: {
    customerEmail: string
    customerName: string
    referenceCode: string
    statusName: string
    shopName: string
  }) => Promise<void>
  getShopName: (userId: string) => Promise<string>
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

      const shopName = await deps.getShopName(userId)
      await deps.sendOrderCreatedEmail({
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        referenceCode,
        shopName,
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

    async advanceOrder(userId: string, orderId: string): Promise<Order> {
      const order = await deps.orderStore.getById(orderId)
      if (!order || order.userId !== userId) throw new Error('Auftrag nicht gefunden')

      const statuses = await deps.getStatuses(userId)
      const sorted = statuses.toSorted((a, b) => a.position - b.position)
      const currentIndex = sorted.findIndex((s) => s.id === order.currentStatusId)

      let nextStatus: (typeof sorted)[number] | undefined
      if (currentIndex === -1) {
        nextStatus = sorted[0]
      } else if (currentIndex >= sorted.length - 1) {
        throw new Error('Bereits am letzten Status')
      } else {
        nextStatus = sorted[currentIndex + 1]
      }
      if (!nextStatus) throw new Error('Keine Status vorhanden')

      const updated = await deps.orderStore.updateCurrentStatus(orderId, nextStatus.id)

      if (nextStatus.notify) {
        const shopName = await deps.getShopName(userId)
        await deps.sendStatusUpdateEmail({
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          referenceCode: order.referenceCode,
          statusName: nextStatus.name,
          shopName,
        })
      }

      return updated
    },

    async revertOrder(userId: string, orderId: string): Promise<Order> {
      const order = await deps.orderStore.getById(orderId)
      if (!order || order.userId !== userId) throw new Error('Auftrag nicht gefunden')

      const statuses = await deps.getStatuses(userId)
      const sorted = statuses.toSorted((a, b) => a.position - b.position)
      const currentIndex = sorted.findIndex((s) => s.id === order.currentStatusId)

      if (currentIndex <= 0) throw new Error('Bereits am ersten Status')

      const prevStatus = sorted[currentIndex - 1]
      if (!prevStatus) throw new Error('Bereits am ersten Status')
      const updated = await deps.orderStore.updateCurrentStatus(orderId, prevStatus.id)

      if (prevStatus.notify) {
        const shopName = await deps.getShopName(userId)
        await deps.sendStatusUpdateEmail({
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          referenceCode: order.referenceCode,
          statusName: prevStatus.name,
          shopName,
        })
      }

      return updated
    },

    async deleteOrder(userId: string, orderId: string): Promise<void> {
      const order = await deps.orderStore.getById(orderId)
      if (!order || order.userId !== userId) throw new Error('Auftrag nicht gefunden')

      await deps.orderStore.remove(orderId)
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
