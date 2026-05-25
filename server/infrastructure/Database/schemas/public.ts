import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'
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

export const order = pgTable('order', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  note: text('note').notNull(),
  referenceCode: text('reference_code').notNull().unique(),
  currentStatusId: text('current_status_id')
    .notNull()
    .references(() => status.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
