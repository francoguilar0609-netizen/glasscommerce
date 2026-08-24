import { runtimeEnv } from "./store";
export type ReservedProduct={id:number;name:string;price_pen:number;quantity:number};
export async function releaseExpiredReservations(){
  await runtimeEnv().DB.prepare("UPDATE inventory_reservations SET status='released',updated_at=? WHERE status='active' AND expires_at<=?").bind(new Date().toISOString(),new Date().toISOString()).run();
}
export async function reserveOrder(input:{orderId:string;email:string;idempotencyKey:string;products:ReservedProduct[];total:number;expiresAt:string}){
  const db=runtimeEnv().DB,now=new Date().toISOString(),reservationId=crypto.randomUUID();
  await db.batch([
    db.prepare("INSERT INTO orders(id,customer_email,currency,total,status,idempotency_key,expires_at,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(input.orderId,input.email,"PEN",input.total,"awaiting_payment",input.idempotencyKey,input.expiresAt,now),
    db.prepare("INSERT INTO inventory_reservations(id,order_id,status,expires_at,created_at,updated_at) VALUES(?,?,'active',?,?,?)").bind(reservationId,input.orderId,input.expiresAt,now,now),
    ...input.products.map(p=>db.prepare("INSERT INTO order_items(order_id,product_id,name,unit_price,quantity) VALUES(?,?,?,?,?)").bind(input.orderId,p.id,p.name,p.price_pen,p.quantity)),
    ...input.products.map(p=>db.prepare("INSERT INTO reservation_items(reservation_id,product_id,quantity) VALUES(?,?,?)").bind(reservationId,p.id,p.quantity)),
  ]);
}
export async function releaseOrder(orderId:string,status="failed"){
  const db=runtimeEnv().DB,now=new Date().toISOString();
  await db.batch([db.prepare("UPDATE inventory_reservations SET status='released',updated_at=? WHERE order_id=? AND status='active'").bind(now,orderId),db.prepare("UPDATE orders SET status=? WHERE id=? AND status!='approved'").bind(status,orderId)]);
}
export async function recordPayment(input:{orderId:string;paymentId:string;status:string;eventKey:string}){
  const db=runtimeEnv().DB,now=new Date().toISOString();
  try{
    if(input.status==="approved")await db.batch([
      db.prepare("INSERT INTO payment_events(provider,event_key,payment_id,order_id,status,created_at) VALUES('mercadopago',?,?,?,?,?)").bind(input.eventKey,input.paymentId,input.orderId,input.status,now),
      db.prepare("UPDATE inventory_reservations SET status='consumed',updated_at=? WHERE order_id=? AND status='active'").bind(now,input.orderId),
      db.prepare("UPDATE orders SET status='approved',payment_id=? WHERE id=? AND status!='approved' AND EXISTS(SELECT 1 FROM inventory_reservations WHERE order_id=? AND status='consumed')").bind(input.paymentId,input.orderId,input.orderId),
      db.prepare("UPDATE orders SET status='payment_review',payment_id=? WHERE id=? AND status!='approved' AND EXISTS(SELECT 1 FROM inventory_reservations WHERE order_id=? AND status='released')").bind(input.paymentId,input.orderId,input.orderId),
    ]);
    else if(["rejected","cancelled","expired"].includes(input.status))await db.batch([
      db.prepare("INSERT INTO payment_events(provider,event_key,payment_id,order_id,status,created_at) VALUES('mercadopago',?,?,?,?,?)").bind(input.eventKey,input.paymentId,input.orderId,input.status,now),
      db.prepare("UPDATE inventory_reservations SET status='released',updated_at=? WHERE order_id=? AND status='active'").bind(now,input.orderId),
      db.prepare("UPDATE orders SET status=?,payment_id=? WHERE id=? AND status!='approved'").bind(input.status,input.paymentId,input.orderId),
    ]);
    else await db.batch([
      db.prepare("INSERT INTO payment_events(provider,event_key,payment_id,order_id,status,created_at) VALUES('mercadopago',?,?,?,?,?)").bind(input.eventKey,input.paymentId,input.orderId,input.status,now),
      db.prepare("UPDATE orders SET status=?,payment_id=? WHERE id=? AND status NOT IN ('approved','rejected','cancelled','expired')").bind(input.status,input.paymentId,input.orderId),
    ]);
    return true;
  }catch(error){if(String(error).includes("UNIQUE"))return false;throw error}
}
