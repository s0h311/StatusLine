import { eq, and } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { status } from '../infrastructure/Database/schemas/public'
import type { StatusIdentifier, StatusStore } from './StatusSequence'

export function createDrizzleStatusStore(db: NodePgDatabase): StatusStore {
  return {
    async getByUserId(userId) {
      return db.select().from(status).where(eq(status.userId, userId))
    },

    async insert(data) {
      const rows = await db.insert(status).values(data).returning()
      return rows[0] as (typeof rows)[number]
    },

    async update(target: StatusIdentifier, data) {
      const [row] = await db
        .update(status)
        .set(data)
        .where(and(eq(status.id, target.id), eq(status.userId, target.userId)))
        .returning()
      return row ?? null
    },

    async remove(target: StatusIdentifier) {
      const result = await db
        .delete(status)
        .where(and(eq(status.id, target.id), eq(status.userId, target.userId)))
        .returning()
      return result.length > 0
    },

    async batchUpdatePositions(userId, updates) {
      await Promise.all(
        updates.map(({ id, position }) =>
          db
            .update(status)
            .set({ position })
            .where(and(eq(status.id, id), eq(status.userId, userId))),
        ),
      )
    },
  }
}
