import { relations, sql } from "drizzle-orm";
import { boolean, check, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  companyName: text("company_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const websites = pgTable("websites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  name: text("name").notNull(),
  widgetColor: text("widget_color").default("#00C2CB"),
  widgetGreeting: text("widget_greeting").default("Hi! How can we help you?"),
  isOnline: boolean("is_online").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: uuid("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  visitorName: text("visitor_name"),
  visitorEmail: text("visitor_email"),
  visitorIp: text("visitor_ip"),
  visitorLocation: text("visitor_location"),
  status: text("status").notNull().default("open"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  statusCheck: check("chats_status_check", sql`${table.status} in ('open', 'closed')`),
}));

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  chatId: uuid("chat_id").notNull().references(() => chats.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  senderCheck: check("messages_sender_check", sql`${table.sender} in ('visitor', 'agent')`),
}));

export const helpArticles = pgTable("help_articles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: uuid("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  category: text("category"),
  content: text("content"),
  isPublished: boolean("is_published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: uuid("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  visitorName: text("visitor_name").notNull(),
  visitorEmail: text("visitor_email"),
  subject: text("subject").notNull(),
  priority: text("priority").notNull().default("medium"),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supportUpdates = pgTable("support_updates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: uuid("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary"),
  label: text("label"),
  content: text("content"),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles),
  websites: many(websites),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const websitesRelations = relations(websites, ({ one, many }) => ({
  owner: one(users, { fields: [websites.ownerId], references: [users.id] }),
  chats: many(chats),
  helpArticles: many(helpArticles),
  supportTickets: many(supportTickets),
  supportUpdates: many(supportUpdates),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  website: one(websites, { fields: [chats.websiteId], references: [websites.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
}));
