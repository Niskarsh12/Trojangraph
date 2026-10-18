import { generateDraft, templateDraft, type DraftFacts } from "@/lib/draft";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let facts: DraftFacts;
  try {
    facts = (await req.json()) as DraftFacts;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!facts?.buyer?.name || !facts?.champion?.name || !facts?.company?.name || !facts?.feature?.name) {
    return Response.json({ error: "Missing graph facts (buyer, champion, company, feature)." }, { status: 400 });
  }

  try {
    return Response.json(await generateDraft(facts));
  } catch (err) {
    console.error("[draft] LLM synthesis failed, using template", err);
    return Response.json({ ...templateDraft(facts), warning: "LLM unavailable; using graph-grounded template." });
  }
}
