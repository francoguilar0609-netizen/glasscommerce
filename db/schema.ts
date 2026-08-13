import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  emoji: text("emoji").notNull(),
  pricePen: integer("price_pen").notNull(),
  stock: integer("stock").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  customerEmail: text("customer_email").notNull(),
  currency: text("currency").notNull().default("PEN"),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending"),
  paymentId: text("payment_id"),
  preferenceId: text("preference_id"),
  createdAt: text("created_at").notNull(),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: text("order_id").notNull(),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
});
