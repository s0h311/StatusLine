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
  }
}

function createTestDeps(overrides: Partial<OrderDeps> = {}): OrderDeps {
  return {
    orderStore: createInMemoryOrderStore(),
    getStatuses: async () => [
      { id: 'status-1', position: 0, name: 'Nicht begonnen' },
      { id: 'status-2', position: 1, name: 'Fertig' },
    ],
    sendOrderCreatedEmail: vi.fn<OrderDeps['sendOrderCreatedEmail']>().mockResolvedValue(undefined),
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
          { id: 'second', position: 1, name: 'In Bearbeitung' },
          { id: 'first', position: 0, name: 'Nicht begonnen' },
          { id: 'third', position: 2, name: 'Fertig' },
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
