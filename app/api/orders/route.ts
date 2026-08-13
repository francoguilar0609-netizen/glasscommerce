import { ensureStore, runtimeEnv, userEmail } from "../../lib/store";
export async function GET(request: Request) {
  const email=userEmail(request); if(!email) return Response.json({error:"No autorizado"},{status:401});
  await ensureStore();
  const orders=await runtimeEnv().DB.prepare("SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC LIMIT 50").bind(email).all();
  return Response.json({orders:orders.results});
}
