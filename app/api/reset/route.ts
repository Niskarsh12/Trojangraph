import { describeError } from "@/lib/falkordb";
import { seedGraph } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const t0 = performance.now();
    const { steps, nodes, edges } = await seedGraph();
    return Response.json({ ok: true, nodes, edges, steps, totalMs: performance.now() - t0 });
  } catch (err) {
    const { message, code } = describeError(err);
    return Response.json({ ok: false, error: message, code }, { status: 503 });
  }
}
