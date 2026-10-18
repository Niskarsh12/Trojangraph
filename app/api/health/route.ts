import { describeError, readQuery } from "@/lib/falkordb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await readQuery<{ nodes: number }>("MATCH (n) RETURN count(n) AS nodes");
    return Response.json({
      ok: true,
      latencyMs: r.roundTripMs,
      serverMs: r.serverMs,
      nodes: Number(r.rows[0]?.nodes ?? 0),
    });
  } catch (err) {
    const { message, code } = describeError(err);
    return Response.json({ ok: false, error: message, code }, { status: 503 });
  }
}
