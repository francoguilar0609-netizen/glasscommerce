-- Read-only hard stop: an existing payment_id must identify exactly one order.
-- The deliberately invalid JSON path is evaluated only when duplicates exist,
-- aborting the migration before any schema or data change. Run
-- scripts/preflight-0001.sql first to list the conflicting rows.
SELECT json_extract('[]', '$[')
FROM (
 SELECT payment_id
 FROM orders
 WHERE payment_id IS NOT NULL
 GROUP BY payment_id
 HAVING COUNT(*) > 1
)
LIMIT 1;
--> statement-breakpoint
ALTER TABLE products ADD COLUMN reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0 AND reserved_stock <= stock);
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN idempotency_key TEXT;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN checkout_fingerprint TEXT;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN checkout_url TEXT;
--> statement-breakpoint
ALTER TABLE orders ADD COLUMN expires_at TEXT;
--> statement-breakpoint
CREATE UNIQUE INDEX orders_customer_idempotency_unique ON orders(customer_email,idempotency_key);
--> statement-breakpoint
CREATE UNIQUE INDEX orders_payment_id_unique ON orders(payment_id) WHERE payment_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX orders_status_idx ON orders(status);
--> statement-breakpoint
CREATE INDEX orders_expiry_idx ON orders(status,expires_at);
--> statement-breakpoint
CREATE TABLE users (
 id TEXT PRIMARY KEY NOT NULL,
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT,
 role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','admin')),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE auth_attempts (
 key TEXT PRIMARY KEY NOT NULL,
 count INTEGER NOT NULL,
 reset_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX auth_attempts_reset_idx ON auth_attempts(reset_at);
--> statement-breakpoint
CREATE TABLE sessions (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 last_seen_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX sessions_user_idx ON sessions(user_id);
--> statement-breakpoint
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);
--> statement-breakpoint
CREATE TABLE inventory_reservations (
 id TEXT PRIMARY KEY NOT NULL,
 order_id TEXT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
 status TEXT NOT NULL CHECK(status IN ('active','consumed','released')),
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX inventory_reservations_expiry_idx ON inventory_reservations(status,expires_at);
--> statement-breakpoint
CREATE TABLE reservation_items (
 id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
 reservation_id TEXT NOT NULL REFERENCES inventory_reservations(id) ON DELETE CASCADE,
 product_id INTEGER NOT NULL REFERENCES products(id),
 quantity INTEGER NOT NULL CHECK(quantity > 0),
 UNIQUE(reservation_id,product_id)
);
--> statement-breakpoint
CREATE TABLE payment_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
 provider TEXT NOT NULL,
 event_key TEXT NOT NULL,
 payment_id TEXT NOT NULL,
 order_id TEXT NOT NULL REFERENCES orders(id),
 status TEXT NOT NULL,
 created_at TEXT NOT NULL,
 UNIQUE(provider,event_key)
);
--> statement-breakpoint
CREATE INDEX payment_events_order_idx ON payment_events(order_id);
--> statement-breakpoint
CREATE TRIGGER reserve_stock_before_insert
BEFORE INSERT ON reservation_items
BEGIN
 SELECT (CASE WHEN NOT EXISTS(
   SELECT 1 FROM products
   WHERE id=NEW.product_id AND active=1 AND stock-reserved_stock>=NEW.quantity
 ) THEN RAISE(ABORT,'insufficient_stock') END);
END;
--> statement-breakpoint
CREATE TRIGGER reserve_stock_after_insert
AFTER INSERT ON reservation_items
BEGIN
 UPDATE products SET reserved_stock=reserved_stock+NEW.quantity WHERE id=NEW.product_id;
END;
--> statement-breakpoint
CREATE TRIGGER release_reserved_stock
AFTER UPDATE OF status ON inventory_reservations
WHEN OLD.status='active' AND NEW.status='released'
BEGIN
 UPDATE products
 SET reserved_stock=reserved_stock-(SELECT quantity FROM reservation_items WHERE reservation_id=NEW.id AND product_id=products.id)
 WHERE id IN (SELECT product_id FROM reservation_items WHERE reservation_id=NEW.id);
END;
--> statement-breakpoint
CREATE TRIGGER consume_reserved_stock
AFTER UPDATE OF status ON inventory_reservations
WHEN OLD.status='active' AND NEW.status='consumed'
BEGIN
 UPDATE products
 SET stock=stock-(SELECT quantity FROM reservation_items WHERE reservation_id=NEW.id AND product_id=products.id),
     reserved_stock=reserved_stock-(SELECT quantity FROM reservation_items WHERE reservation_id=NEW.id AND product_id=products.id)
 WHERE id IN (SELECT product_id FROM reservation_items WHERE reservation_id=NEW.id);
END;

