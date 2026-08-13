import { ensureStore, runtimeEnv } from "../../../lib/store";
export async function POST(request: Request) {
  await ensureStore();
  const url=new URL(request.url); const body=await request.json().catch(()=>({})) as {data?:{id?:string}};
  const paymentId=body.data?.id || url.searchParams.get("data.id"); const token=runtimeEnv().MERCADO_PAGO_ACCESS_TOKEN;
  if(!paymentId || !token) return new Response("ok");
  const response=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${token}`}});
  if(!response.ok) return new Response("verification failed",{status:502});
  const payment=await response.json() as {external_reference?:string;status?:string;transaction_amount?:number;currency_id?:string};
  const order=payment.external_reference ? await runtimeEnv().DB.prepare("SELECT * FROM orders WHERE id = ?").bind(payment.external_reference).first<{total:number}>() : null;
  if(order && payment.currency_id==="PEN" && Math.round(Number(payment.transaction_amount)*100)===Number(order.total)) {
    await runtimeEnv().DB.prepare("UPDATE orders SET status = ?, payment_id = ? WHERE id = ?").bind(payment.status || "pending",String(paymentId),payment.external_reference).run();
  }
  return new Response("ok");
}
