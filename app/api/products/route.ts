import { ensureStore, runtimeEnv } from "../../lib/store";

export async function GET() {
  await ensureStore();
  const rows = await runtimeEnv().DB.prepare("SELECT * FROM products WHERE active = 1 ORDER BY id").all();
  return Response.json({ products: rows.results, usdPenRate: Number(runtimeEnv().USD_PEN_RATE || 3.75) });
}
