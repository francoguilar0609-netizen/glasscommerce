import{recordPayment}from"../../../lib/inventory";import{verifyMercadoPagoSignature}from"../../../lib/mercadopago";import{ensureStore,runtimeEnv}from"../../../lib/store";
export async function POST(request:Request){await ensureStore();const body=await request.json().catch(()=>({})) as {data?:{id?:string|number}};const url=new URL(request.url),paymentId=String(body.data?.id||url.searchParams.get("data.id")||"");const env=runtimeEnv();
 if(!paymentId||!env.MERCADO_PAGO_ACCESS_TOKEN||!env.MERCADO_PAGO_WEBHOOK_SECRET)return new Response("Webhook no configurado",{status:503});
 if(!(await verifyMercadoPagoSignature(request,paymentId,env.MERCADO_PAGO_WEBHOOK_SECRET)))return new Response("Firma inválida",{status:401});
 const response=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`}});if(!response.ok)return new Response("verification failed",{status:502});
 const payment=await response.json() as {external_reference?:string;status?:string;transaction_amount?:number;currency_id?:string;id?:number|string};
 const order=payment.external_reference?await env.DB.prepare("SELECT id,total,preference_id FROM orders WHERE id=?").bind(payment.external_reference).first<{id:string;total:number;preference_id:string|null}>():null;
 if(!order||payment.currency_id!=="PEN"||Math.round(Number(payment.transaction_amount)*100)!==order.total)return new Response("payment mismatch",{status:422});
 const status=payment.status||"pending";await recordPayment({orderId:order.id,paymentId:String(payment.id||paymentId),status,eventKey:`${paymentId}:${status}`});return new Response("ok");
}