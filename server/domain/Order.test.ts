import { describe, test, expect, vi } from 'vitest'
import { createOrderModule, defaultGenerateReferenceCode, type Order, type OrderStore, type OrderDeps } from './Order'

function createInMemoryOrderStore(): OrderStore {
  const orders: Order[] = []
  let nextId = 1

  return {
    async insert(data) {
      const order: Order = { id: String(nextId++), createdAt: new Date(), ...data }
      orders.push(order)
      return order
    },
    async existsByReferenceCode(code) {
      return orders.some((o) => o.referenceCode === code)
    },
    async getByUserId(userId) {
      return orders.filter((o) => o.userId === userId)
    },
    async getByReferenceCode(code) {
      return orders.find((o) => o.referenceCode === code) ?? null
    },
    async getById(id) {
      return orders.find((o) => o.id === id) ?? null
    },
    async updateCurrentStatus(id, currentStatusId) {
      const order = orders.find((o) => o.id === id)
      if (!order) throw new Error('Order not found')
      order.currentStatusId = currentStatusId
      return order
    },
    async remove(id) {
      const index = orders.findIndex((o) => o.id === id)
      if (index !== -1) orders.splice(index, 1)
    },
  }
}

function createTestDeps(overrides: Partial<OrderDeps> = {}): OrderDeps {
  return {
    orderStore: createInMemoryOrderStore(),
    getStatuses: async () => [
      { id: 'status-1', position: 0, name: 'Nicht begonnen', notify: false },
      { id: 'status-2', position: 1, name: 'Fertig', notify: false },
    ],
    sendOrderCreatedEmail: vi.fn<OrderDeps['sendOrderCreatedEmail']>().mockResolvedValue(undefined),
    sendStatusUpdateEmail: vi.fn<OrderDeps['sendStatusUpdateEmail']>().mockResolvedValue(undefined),
    getShopName: async () => 'Testladen',
    generateReferenceCode: () => 'ABC123',
    ...overrides,
  }
}

const USER = 'user-1'
const INPUT = { customerName: 'Max Mustermann', customerEmail: 'max@example.com', note: 'Reparatur Schuh' }

describe('Order', () => {
  describe('createOrder', () => {
    test('created order is returned with correct data', async () => {
      const deps = createTestDeps()
      const mod = createOrderModule(deps)

      const order = await mod.createOrder(USER, INPUT)

      expect(order.customerName).toBe('Max Mustermann')
      expect(order.customerEmail).toBe('max@example.com')
      expect(order.note).toBe('Reparatur Schuh')
      expect(order.userId).toBe(USER)
      expect(order.referenceCode).toBe('ABC123')
    })

    test('order is assigned to the first status in the sequence', async () => {
      const deps = createTestDeps({
        getStatuses: async () => [
          { id: 'second', position: 1, name: 'In Bearbeitung', notify: false },
          { id: 'first', position: 0, name: 'Nicht begonnen', notify: false },
          { id: 'third', position: 2, name: 'Fertig', notify: false },
        ],
      })
      const mod = createOrderModule(deps)

      const order = await mod.createOrder(USER, INPUT)

      expect(order.currentStatusId).toBe('first')
    })

    test('throws when user has no statuses', async () => {
      const deps = createTestDeps({ getStatuses: async () => [] })
      const mod = createOrderModule(deps)

      await expect(mod.createOrder(USER, INPUT)).rejects.toThrow('Keine Status vorhanden')
    })

    test('email is sent on creation with reference code', async () => {
      const sendEmail = vi.fn<OrderDeps['sendOrderCreatedEmail']>().mockResolvedValue(undefined)
      const deps = createTestDeps({ sendOrderCreatedEmail: sendEmail })
      const mod = createOrderModule(deps)

      await mod.createOrder(USER, INPUT)

      expect(sendEmail).toHaveBeenCalledWith({
        customerEmail: 'max@example.com',
        customerName: 'Max Mustermann',
        referenceCode: 'ABC123',
        shopName: 'Testladen',
      })
    })

    test('retries reference code on collision', async () => {
      const store = createInMemoryOrderStore()
      await store.insert({
        userId: 'other',
        customerName: 'x',
        customerEmail: 'x@x.com',
        note: 'x',
        referenceCode: 'TAKEN1',
        currentStatusId: 's',
      })

      let callCount = 0
      const deps = createTestDeps({
        orderStore: store,
        generateReferenceCode: () => {
          callCount++
          return callCount === 1 ? 'TAKEN1' : 'FRESH1'
        },
      })
      const mod = createOrderModule(deps)

      const order = await mod.createOrder(USER, INPUT)

      expect(order.referenceCode).toBe('FRESH1')
      expect(callCount).toBe(2)
    })

    test('throws after max retries for reference code', async () => {
      const deps = createTestDeps({
        orderStore: {
          async insert() {
            throw new Error('should not be called')
          },
          async existsByReferenceCode() {
            return true
          },
          async getByUserId() {
            return []
          },
          async getByReferenceCode() {
            return null
          },
          async getById() {
            return null
          },
          async updateCurrentStatus() {
            throw new Error('should not be called')
          },
          async remove() {
            throw new Error('should not be called')
          },
        },
      })
      const mod = createOrderModule(deps)

      await expect(mod.createOrder(USER, INPUT)).rejects.toThrow('Referenzcode konnte nicht generiert werden')
    })
  })

  describe('getOrders', () => {
    test('returns orders with status name attached', async () => {
      let codeSeq = 0
      const deps = createTestDeps({ generateReferenceCode: () => `CODE${++codeSeq}` })
      const mod = createOrderModule(deps)

      await mod.createOrder(USER, INPUT)
      await mod.createOrder(USER, { ...INPUT, customerName: 'Anna Schmidt', customerEmail: 'anna@example.com' })

      const orders = await mod.getOrders(USER)

      expect(orders).toHaveLength(2)
      expect(orders[0]?.statusName).toBe('Nicht begonnen')
      expect(orders[1]?.statusName).toBe('Nicht begonnen')
    })

    test('returns empty array when user has no orders', async () => {
      const deps = createTestDeps()
      const mod = createOrderModule(deps)

      const orders = await mod.getOrders(USER)

      expect(orders).toEqual([])
    })

    test('only returns orders for the given user', async () => {
      let codeSeq = 0
      const deps = createTestDeps({ generateReferenceCode: () => `CODE${++codeSeq}` })
      const mod = createOrderModule(deps)

      await mod.createOrder(USER, INPUT)
      await mod.createOrder('other-user', { ...INPUT, customerName: 'Other User' })

      const orders = await mod.getOrders(USER)

      expect(orders).toHaveLength(1)
      expect(orders[0]?.customerName).toBe('Max Mustermann')
    })
  })

  describe('lookupOrderStatus', () => {
    test('returns status sequence with current position for valid reference code', async () => {
      const deps = createTestDeps()
      const mod = createOrderModule(deps)

      await mod.createOrder(USER, INPUT)
      const result = await mod.lookupOrderStatus('ABC123')

      expect(result).toEqual({
        statuses: [
          { name: 'Nicht begonnen', position: 0 },
          { name: 'Fertig', position: 1 },
        ],
        currentStatusName: 'Nicht begonnen',
        currentPosition: 0,
      })
    })

    test('returns null for unknown reference code', async () => {
      const deps = createTestDeps()
      const mod = createOrderModule(deps)

      const result = await mod.lookupOrderStatus('NOPE99')

      expect(result).toBeNull()
    })

    test('does not expose customer data', async () => {
      const deps = createTestDeps()
      const mod = createOrderModule(deps)

      await mod.createOrder(USER, INPUT)
      const result = await mod.lookupOrderStatus('ABC123')

      const json = JSON.stringify(result)
      expect(json).not.toContain('Max Mustermann')
      expect(json).not.toContain('max@example.com')
      expect(json).not.toContain('Reparatur Schuh')
    })
  })

  describe('advanceOrder', () => {
    test('moves order to the next status in the sequence', async () => {
      const deps = createTestDeps({
        getStatuses: async () => [
          { id: 's1', position: 0, name: 'Offen', notify: false },
          { id: 's2', position: 1, name: 'In Bearbeitung', notify: false },
          { id: 's3', position: 2, name: 'Fertig', notify: false },
        ],
      })
      const mod = createOrderModule(deps)
      const order = await mod.createOrder(USER, INPUT)

      const updated = await mod.advanceOrder(USER, order.id)

      expect(updated.currentStatusId).toBe('s2')
    })

    test('throws when order is already at last status', async () => {
      const deps = createTestDeps({
        getStatuses: async () => [
          { id: 's1', position: 0, name: 'Offen', notify: false },
          { id: 's2', position: 1, name: 'Fertig', notify: false },
        ],
      })
      const mod = createOrderModule(deps)
      const order = await mod.createOrder(USER, INPUT)
      await mod.advanceOrder(USER, order.id)

      await expect(mod.advanceOrder(USER, order.id)).rejects.toThrow('Bereits am letzten Status')
    })

    test('sends email when advancing into a notify-flagged status', async () => {
      const sendEmail = vi.fn<OrderDeps['sendStatusUpdateEmail']>().mockResolvedValue(undefined)
      const deps = createTestDeps({
        getStatuses: async () => [
          { id: 's1', position: 0, name: 'Offen', notify: false },
          { id: 's2', position: 1, name: 'Versendet', notify: true },
        ],
        sendStatusUpdateEmail: sendEmail,
      })
      const mod = createOrderModule(deps)
      const order = await mod.createOrder(USER, INPUT)

      await mod.advanceOrder(USER, order.id)

      expect(sendEmail).toHaveBeenCalledWith({
        customerEmail: 'max@example.com',
        customerName: 'Max Mustermann',
        referenceCode: 'ABC123',
        statusName: 'Versendet',
        shopName: 'Testladen',
      })
    })

    test('does not send email when advancing into a non-notify status', async () => {
      const sendEmail = vi.fn<OrderDeps['sendStatusUpdateEmail']>().mockResolvedValue(undefined)
      const deps = createTestDeps({
        getStatuses: async () => [
          { id: 's1', position: 0, name: 'Offen', notify: false },
          { id: 's2', position: 1, name: 'In Bearbeitung', notify: false },
        ],
        sendStatusUpdateEmail: sendEmail,
      })
      const mod = createOrderModule(deps)
      const order = await mod.createOrder(USER, INPUT)

      await mod.advanceOrder(USER, order.id)

      expect(sendEmail).not.toHaveBeenCalled()
    })

    test('advances to first status when current status was removed from sequence', async () => {
      const store = createInMemoryOrderStore()
      await store.insert({
        userId: USER,
        customerName: 'Max',
        customerEmail: 'max@example.com',
        note: 'test',
        referenceCode: 'REMOVED',
        currentStatusId: 'deleted-status',
      })
      const deps = createTestDeps({
        orderStore: store,
        getStatuses: async () => [
          { id: 's1', position: 0, name: 'Offen', notify: false },
          { id: 's2', position: 1, name: 'Fertig', notify: false },
        ],
      })
      const mod = createOrderModule(deps)
      const orders = await mod.getOrders(USER)

      const updated = await mod.advanceOrder(USER, orders[0]?.id ?? '')

      expect(updated.currentStatusId).toBe('s1')
    })
  })

  describe('revertOrder', () => {
    test('moves order to the previous status in the sequence', async () => {
      const deps = createTestDeps({
        getStatuses: async () => [
          { id: 's1', position: 0, name: 'Offen', notify: false },
          { id: 's2', position: 1, name: 'In Bearbeitung', notify: false },
          { id: 's3', position: 2, name: 'Fertig', notify: false },
        ],
      })
      const mod = createOrderModule(deps)
      const order = await mod.createOrder(USER, INPUT)
      await mod.advanceOrder(USER, order.id)
      await mod.advanceOrder(USER, order.id)

      const updated = await mod.revertOrder(USER, order.id)

      expect(updated.currentStatusId).toBe('s2')
    })

    test('throws when order is already at first status', async () => {
      const deps = createTestDeps()
      const mod = createOrderModule(deps)
      const order = await mod.createOrder(USER, INPUT)

      await expect(mod.revertOrder(USER, order.id)).rejects.toThrow('Bereits am ersten Status')
    })

    test('sends email when reverting into a notify-flagged status', async () => {
      const sendEmail = vi.fn<OrderDeps['sendStatusUpdateEmail']>().mockResolvedValue(undefined)
      const deps = createTestDeps({
        getStatuses: async () => [
          { id: 's1', position: 0, name: 'Offen', notify: true },
          { id: 's2', position: 1, name: 'Fertig', notify: false },
        ],
        sendStatusUpdateEmail: sendEmail,
      })
      const mod = createOrderModule(deps)
      const order = await mod.createOrder(USER, INPUT)
      await mod.advanceOrder(USER, order.id)

      await mod.revertOrder(USER, order.id)

      expect(sendEmail).toHaveBeenCalledWith({
        customerEmail: 'max@example.com',
        customerName: 'Max Mustermann',
        referenceCode: 'ABC123',
        statusName: 'Offen',
        shopName: 'Testladen',
      })
    })
  })

  describe('deleteOrder', () => {
    test('removes the order', async () => {
      const deps = createTestDeps()
      const mod = createOrderModule(deps)
      const order = await mod.createOrder(USER, INPUT)

      await mod.deleteOrder(USER, order.id)

      const orders = await mod.getOrders(USER)
      expect(orders).toHaveLength(0)
    })

    test('throws when order does not exist', async () => {
      const deps = createTestDeps()
      const mod = createOrderModule(deps)

      await expect(mod.deleteOrder(USER, 'missing')).rejects.toThrow('Auftrag nicht gefunden')
    })

    test('throws when order belongs to another user', async () => {
      const deps = createTestDeps()
      const mod = createOrderModule(deps)
      const order = await mod.createOrder(USER, INPUT)

      await expect(mod.deleteOrder('other-user', order.id)).rejects.toThrow('Auftrag nicht gefunden')
    })
  })

  describe('generateReferenceCode', () => {
    test('produces 6-char uppercase alphanumeric string', () => {
      const code = defaultGenerateReferenceCode()
      expect(code).toMatch(/^[A-Z0-9]{6}$/)
    })

    test('produces different codes on repeated calls', () => {
      const codes = new Set(Array.from({ length: 50 }, () => defaultGenerateReferenceCode()))
      expect(codes.size).toBeGreaterThan(1)
    })
  })
})
