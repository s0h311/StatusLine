import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const status = pgTable('status', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').notNull(),
  notify: boolean('notify').default(false).notNull(),
})
