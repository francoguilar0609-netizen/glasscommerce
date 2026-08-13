import { ensureStore, orderId, runtimeEnv, userEmail } from "../../lib/store";

type Line = { productId: number; quantity: number };
export async function POST(request: Request) {
  const email = userEmail(request);
  if (!email) return Response.json({ error: "Inicia sesión con ChatGPT para comprar." }, { status: 401 });
  await ensureStore();
  const body = await request.json() as { items?: Line[] };
  const lines = (body.items || []).filter(x => Number.isInteger(x.productId) && Number.isInteger(x.quantity) && x.quantity > 0 && x.quantity <= 10);
  if (!lines.length) return Response.json({ error: "El carrito está vacío." }, { status: 400 });
  const products = [];
  for (const line of lines) {
    const product = await runtimeEnv().DB.prepare("SELECT * FROM products WHERE id = ? AND active = 1").bind(line.productId).first<Record<string, unknown>>();
    if (!product || Number(product.stock) < line.quantity) return Response.json({ error: "Un producto no tiene stock suficiente." }, { status: 409 });
    products.push({ ...product, quantity: line.quantity });
  }
  const total = products.reduce((sum,p)=>sum + Number(p.price_pen) * Number(p.quantity), 0);
  const id = orderId();
  await runtimeEnv().DB.batch([
    runtimeEnv().DB.prepare("INSERT INTO orders (id,customer_email,currency,total,status,created_at) VALUES (?,?,?,?,?,?)").bind(id,email,"PEN",total,"pending",new Date().toISOString()),
    ...products.map(p=>runtimeEnv().DB.prepare("INSERT INTO order_items (order_id,product_id,name,unit_price,quantity) VALUES (?,?,?,?,?)").bind(id,p.id,p.name,p.price_pen,p.quantity)),
  ]);
  const token = runtimeEnv().MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) return Response.json({ error: "Mercado Pago aún está en modo de configuración.", orderId: id }, { status: 503 });
  const origin = new URL(request.url).origin;
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", { method:"POST", headers:{ Authorization:`Bearer ${token}`, "Content-Type":"application/json", "X-Idempotency-Key":id }, body:JSON.stringify({ external_reference:id, items:products.map(p=>({ id:String(p.id), title:p.name, currency_id:"PEN", unit_price:Number(p.price_pen)/100, quantity:p.quantity })), payer:{ email }, back_urls:{ success:`${origin}/orders?payment=success`, pending:`${origin}/orders?payment=pending`, failure:`${origin}/orders?payment=failure` }, auto_return:"approved", notification_url:`${origin}/api/mercadopago/webhook` }) });
  if (!response.ok) return Response.json({ error:"Mercado Pago rechazó la creación del pago.", orderId:id }, { status:502 });
  const preference = await response.json() as { id:string; init_point:string; sandbox_init_point?:string };
  await runtimeEnv().DB.prepare("UPDATE orders SET preference_id = ? WHERE id = ?").bind(preference.id,id).run();
  return Response.json({ orderId:id, checkoutUrl: preference.init_point || preference.sandbox_init_point });
}
