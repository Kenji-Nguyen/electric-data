import { pgTable, uuid, varchar, timestamp, decimal } from 'drizzle-orm/pg-core'

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const electricalDevices = pgTable('electrical_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  deviceName: varchar('device_name', { length: 255 }).notNull(),
  powerWatts: decimal('power_watts', { precision: 10, scale: 2 }).notNull(),
  usageHoursPerDay: decimal('usage_hours_per_day', { precision: 4, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
export type ElectricalDevice = typeof electricalDevices.$inferSelect
export type NewElectricalDevice = typeof electricalDevices.$inferInsert