import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { order } from '../infrastructure/Database/schemas/public'
import type { OrderStore } from './Order'

export function createDrizzleOrderStore(db: NodePgDatabase): OrderStore {
  return {
    async insert(data) {
      const rows = await db.insert(order).values(data).returning()
      return rows[0] as typeof rows[number]
    },

    async existsByReferenceCode(code) {
      const rows = await db.select({ id: order.id }).from(order).where(eq(order.referenceCode, code))
      return rows.length > 0
    },
  }
}
