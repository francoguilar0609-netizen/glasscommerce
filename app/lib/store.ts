export type Product = { id: number; name: string; slug: string; category: string; description: string; emoji: string; price_pen: number; stock: number; active: number };
type RuntimeEnv = { DB: D1Database; MERCADO_PAGO_ACCESS_TOKEN?: string; ADMIN_EMAILS?: string; USD_PEN_RATE?: string };

export function runtimeEnv() {
  const runtime = (globalThis as typeof globalThis & { __GLASSCOMMERCE_ENV?: RuntimeEnv }).__GLASSCOMMERCE_ENV;
  if (!runtime?.DB) throw new Error("La base de datos de la tienda no está disponible.");
  return runtime;
}

export async function ensureStore() {
  const { DB } = runtimeEnv();
  await DB.batch([
    DB.prepare("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, category TEXT NOT NULL, description TEXT NOT NULL, emoji TEXT NOT NULL, price_pen INTEGER NOT NULL, stock INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_email TEXT NOT NULL, currency TEXT NOT NULL DEFAULT 'PEN', total INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending', payment_id TEXT, preference_id TEXT, created_at TEXT NOT NULL)"),
    DB.prepare("CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL, product_id INTEGER NOT NULL, name TEXT NOT NULL, unit_price INTEGER NOT NULL, quantity INTEGER NOT NULL)"),
    DB.prepare("CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id)"),
    DB.prepare("CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_email)"),
  ]);
  const count = await DB.prepare("SELECT COUNT(*) AS count FROM products").first<{ count: number }>();
  if (!count?.count) {
    const seed = [
      ["Aurora Headphones","aurora-headphones","Audio","Sonido espacial, batería de 40 horas y cancelación adaptativa.","🎧",47900,18],
      ["Halo Desk Light","halo-desk-light","Workspace","Iluminación regulable con control táctil y USB-C.","💡",29500,12],
      ["Drift Keyboard","drift-keyboard","Workspace","Teclado mecánico inalámbrico de perfil bajo.","⌨️",40500,8],
      ["Nova Speaker","nova-speaker","Audio","Audio estéreo portátil con cuerpo resistente.","🔊",55500,6],
      ["Orbit Watch","orbit-watch","Wearables","Salud, cinco días de batería y pantalla siempre activa.","⌚",70500,14],
      ["Prism Bottle","prism-bottle","Lifestyle","Acero térmico que conserva bebidas frías por 24 horas.","💧",14500,24],
    ];
    await DB.batch(seed.map(p => DB.prepare("INSERT INTO products (name,slug,category,description,emoji,price_pen,stock) VALUES (?,?,?,?,?,?,?)").bind(...p)));
  }
}

export function userEmail(request: Request) { return request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase() || null; }
export function isAdmin(email: string | null) { return !!email && (runtimeEnv().ADMIN_EMAILS || "").toLowerCase().split(",").map(v=>v.trim()).includes(email); }
export function orderId() { return `GC-${crypto.randomUUID().slice(0,8).toUpperCase()}`; }
