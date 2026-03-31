import { mysqlTable, mysqlSchema, AnyMySqlColumn, int, timestamp, varchar, text, mysqlEnum, index } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const cart = mysqlTable("cart", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	productId: int().notNull(),
	quantity: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const categories = mysqlTable("categories", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	nameEn: varchar({ length: 255 }),
	description: text(),
	icon: varchar({ length: 500 }),
	order: int().default(0).notNull(),
	status: mysqlEnum(['active','inactive']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const config = mysqlTable("config", {
	id: int().autoincrement().notNull(),
	key: varchar({ length: 255 }).notNull(),
	value: text().notNull(),
	description: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("config_key_unique").on(table.key),
]);

export const orderItems = mysqlTable("orderItems", {
	id: int().autoincrement().notNull(),
	orderId: int().notNull(),
	productId: int().notNull(),
	quantity: int().notNull(),
	price: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const orders = mysqlTable("orders", {
	id: int().autoincrement().notNull(),
	orderNumber: varchar({ length: 50 }).notNull(),
	userId: int(),
	totalPrice: int().notNull(),
	status: mysqlEnum(['pending','processing','shipped','delivered','cancelled']).default('pending').notNull(),
	paymentStatus: mysqlEnum(['unpaid','paid','refunded','failed']).default('unpaid').notNull(),
	shippingAddress: text(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	stripePaymentIntentId: varchar({ length: 255 }),
	stripeSessionId: varchar({ length: 255 }),
	whopPaymentId: varchar({ length: 255 }),
},
(table) => [
	index("orders_orderNumber_unique").on(table.orderNumber),
]);

export const products = mysqlTable("products", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	price: int().notNull(),
	originalPrice: int(),
	categoryId: int(),
	image: varchar({ length: 500 }),
	stock: int().default(0).notNull(),
	sold: int().default(0).notNull(),
	rating: int().default(0),
	status: mysqlEnum(['active','inactive','deleted']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const banners = mysqlTable("banners", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	titleEn: varchar({ length: 255 }),
	subtitle: varchar({ length: 255 }),
	subtitleEn: varchar({ length: 255 }),
	image: varchar({ length: 500 }).notNull(),
	link: varchar({ length: 500 }),
	ctaText: varchar({ length: 100 }),
	ctaTextEn: varchar({ length: 100 }),
	order: int().default(0).notNull(),
	status: mysqlEnum(['active','inactive']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("banners_order_status").on(table.order, table.status),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);

// ── Insert type helpers (used in routers.ts) ──────────────────
export type InsertOrder      = typeof orders.$inferInsert;
export type InsertOrderItem  = typeof orderItems.$inferInsert;
export type InsertCartItem   = typeof cart.$inferInsert;
export type InsertProduct    = typeof products.$inferInsert;
