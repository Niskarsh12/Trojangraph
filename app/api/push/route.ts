export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { briefing, company } = (await req.json().catch(() => ({}))) as { briefing?: string; company?: string };
  if (!briefing) return Response.json({ ok: false, error: "Missing briefing" }, { status: 400 });

  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    return Response.json({
      ok: false,
      error: "SLACK_WEBHOOK_URL not set. Add it to .env.local to enable push.",
    });
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "```" + briefing + "```" }),
    });
    if (!res.ok) return Response.json({ ok: false, error: `Slack responded ${res.status}` });
    return Response.json({ ok: true, message: `Briefing for ${company ?? "account"} posted to Slack.` });
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : "Push failed" });
  }
}
