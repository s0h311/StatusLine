import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { order } from '../infrastructure/Database/schemas/public'
import type { OrderStore } from './Order'

export function createDrizzleOrderStore(db: NodePgDatabase): OrderStore {
  return {
    async insert(data) {
      const rows = await db.insert(order).values(data).returning()
      return rows[0] as (typeof rows)[number]
    },

    async existsByReferenceCode(code) {
      const rows = await db.select({ id: order.id }).from(order).where(eq(order.referenceCode, code))
      return rows.length > 0
    },

    async getByUserId(userId) {
      return db.select().from(order).where(eq(order.userId, userId))
    },

    async getByReferenceCode(code) {
      const rows = await db.select().from(order).where(eq(order.referenceCode, code))
      return rows[0] ?? null
    },

    async getById(id) {
      const rows = await db.select().from(order).where(eq(order.id, id))
      return rows[0] ?? null
    },

    async updateCurrentStatus(id, currentStatusId) {
      const rows = await db.update(order).set({ currentStatusId }).where(eq(order.id, id)).returning()
      return rows[0] as (typeof rows)[number]
    },
  }
}
