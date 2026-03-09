import {
  pgTable,
  serial,
  varchar,
  boolean,
  integer,
  timestamp,
  date,
  text,
} from "drizzle-orm/pg-core";

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scheduleOverrides = pgTable("schedule_overrides", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  memberId: integer("member_id").references(() => members.id),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
});

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type ScheduleOverride = typeof scheduleOverrides.$inferSelect;
export type NewScheduleOverride = typeof scheduleOverrides.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type AdminSetting = typeof adminSettings.$inferSelect;
