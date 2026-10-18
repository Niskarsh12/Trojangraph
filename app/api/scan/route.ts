import { describeError } from "@/lib/falkordb";
import { runScan } from "@/lib/scan";
import type { ScanEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT = 4_000;

export async function POST(req: Request) {
  let body: { text?: unknown; handle?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.slice(0, MAX_TEXT) : "";
  const handle = typeof body.handle === "string" && body.handle ? body.handle : undefined;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: ScanEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        for await (const event of runScan({ text, handle })) send(event);
      } catch (err) {
        send({ type: "error", ...describeError(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
