import OpenAI from "openai";
import type { DraftResult, ScanResult } from "./types";

export type DraftFacts = Pick<
  ScanResult,
  "champion" | "buyer" | "company" | "feature" | "investor" | "signalRef" | "signalText" | "platform" | "handle" | "path"
>;

const SYSTEM_PROMPT = `You are TrojanGraph, a revenue-intelligence agent. You write warm introduction emails
that an investor forwards to an enterprise executive on behalf of a portfolio founder.

HARD RULES:
- Use ONLY facts present in the GRAPH_FACTS JSON. Never invent names, numbers, companies, metrics or customers.
- The email is written in the investor's voice, addressed to the executive (Economic Buyer).
- Describe how the investor reaches the executive using warm_path only. Each "via" is an edge between
  that person and the previous one. If warm_path has intermediaries between the investor and the
  executive, name them; never claim the investor and executive know each other directly unless they are adjacent.
- Cite the technical champion's exact signal (reference + the specific problem) and name the enterprise feature.
- Propose a scoped enterprise pilot. Do not state a price.
- Never reveal that identities were resolved from pseudonymous handles; refer to the champion by real name only as "someone on your team" or by name.
- Under 170 words. Plain text. No markdown, no placeholders in brackets.
Return JSON: {"subject": string, "body": string}`;

const sharedCompany = (via?: string) => /Ex-colleagues at (.+?) \(/.exec(via ?? "")?.[1];

/** sequence = [Founder, Investor, ...intermediaries, Buyer]; each step's `via` links it to the previous step. */
function warmOpener(sequence: DraftFacts["path"]["sequence"]): string {
  if (sequence.length === 3) {
    const company = sharedCompany(sequence[2].via);
    return company ? `Hope you're well. It's been a while since our days together at ${company}.` : `Hope you're well.`;
  }
  if (sequence.length >= 4) {
    const bridge = sequence[2];
    const withInvestor = sharedCompany(bridge.via);
    const withBuyer = sequence.length === 4 ? sharedCompany(sequence[3].via) : undefined;
    const first = withInvestor ? `${bridge.name}, who I worked with at ${withInvestor},` : `${bridge.name}`;
    return withBuyer
      ? `${first} mentioned you two overlapped at ${withBuyer} and suggested I reach out.`
      : `${first} suggested I reach out to you.`;
  }
  return `Hope you're well.`;
}

export function templateDraft(f: DraftFacts): DraftResult {
  const investor = f.investor?.name ?? "A mutual connection";
  const firstName = f.buyer.name.split(" ")[0];
  const opener = warmOpener(f.path.sequence);
  const problem = f.signalText.split("\n").find((l) => /^title:/i.test(l))?.replace(/^title:\s*/i, "") ?? f.signalRef;
  return {
    source: "template",
    subject: `Intro: ${f.feature.name} for ${f.company.name} Platform`,
    body: [
      `Hi ${firstName},`,
      ``,
      opener,
      ``,
      `I'm an investor in a graph-database team I think is relevant to you. ${f.champion.name} on your team recently raised ${f.signalRef} ("${problem}") in their community. That is exactly the problem their ${f.feature.name} (${f.feature.tier} tier) is built to solve.`,
      ``,
      `Rather than an evaluation by trial and error, the founder would like to propose a scoped enterprise pilot with your team, built around that exact workload.`,
      ``,
      `Open to a 20-minute call next week? Happy to make the connection.`,
      ``,
      `Best,`,
      investor,
    ].join("\n"),
  };
}

export async function generateDraft(facts: DraftFacts): Promise<DraftResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return templateDraft(facts);

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const client = new OpenAI({ apiKey, timeout: 20_000, maxRetries: 1 });

  const graphFacts = {
    investor: facts.investor,
    executive: facts.buyer,
    target_company: facts.company,
    technical_champion: { name: facts.champion.name, title: facts.champion.title },
    signal: { reference: facts.signalRef, channel: facts.platform, text: facts.signalText },
    enterprise_feature: facts.feature,
    warm_path: facts.path.sequence.map((s) => ({ name: s.name, role: s.kind, via: s.via ?? null })),
  };

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `GRAPH_FACTS:\n${JSON.stringify(graphFacts, null, 2)}` },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as { subject?: string; body?: string };
  if (!parsed.subject || !parsed.body) return templateDraft(facts);
  return { subject: parsed.subject, body: parsed.body, source: "openai", model };
}
