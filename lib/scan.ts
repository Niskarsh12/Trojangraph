import { readQuery, type TimedResult } from "./falkordb";
import type {
  CypherLog,
  GraphEdgeDTO,
  GraphNodeDTO,
  NodeKind,
  PathStep,
  ScanEvent,
  ScanResult,
} from "./types";

export interface ScanInput {
  text: string;
  handle?: string;
}

interface FalkorNode {
  id: number;
  labels: string[];
  properties: Record<string, unknown>;
}
interface FalkorEdge {
  id: number;
  relationshipType: string;
  sourceId: number;
  destinationId: number;
  properties: Record<string, unknown>;
}
interface FalkorPath {
  nodes: FalkorNode[];
  edges: FalkorEdge[];
}

const Q_RESOLVE_HANDLE = `MATCH (acc:Account)
WHERE toLower($text) CONTAINS toLower(acc.handle)
RETURN acc.handle AS handle, acc.platform AS platform
ORDER BY size(acc.handle) DESC
LIMIT 1`;

const Q_IDENTITY = `MATCH (acc:Account {handle: $handle})-[:IDENTIFIED_AS]->(dev:Developer)
MATCH (dev)-[:EMPLOYED_BY]->(comp:Company)
MATCH (exec:Executive)-[:MANAGES]->(dev)
RETURN dev.name AS ChampionName,
       dev.work_email AS ChampionEmail,
       dev.title AS ChampionTitle,
       acc.platform AS Platform,
       comp.name AS TargetCompany,
       comp.domain AS Domain,
       comp.tier AS Tier,
       comp.employee_count AS Employees,
       exec.name AS BuyerName,
       exec.title AS BuyerTitle,
       exec.email AS BuyerEmail`;

const Q_SIBLING_ACCOUNTS = `MATCH (dev:Developer {name: $champion})<-[:IDENTIFIED_AS]-(acc:Account)
RETURN acc.platform AS platform, acc.handle AS handle`;

const Q_FEATURE = `MATCH (comp:Company {name: $company})
OPTIONAL MATCH (comp)-[:EVALUATING]->(eval:ProductFeature)
WITH eval
MATCH (f:ProductFeature)
WITH f,
     size([k IN f.keywords WHERE toLower($text) CONTAINS k]) AS score,
     CASE WHEN eval IS NOT NULL AND f.name = eval.name THEN 1 ELSE 0 END AS evaluated
RETURN f.name AS name, f.tier AS tier, f.price_acv AS acv, score, evaluated
ORDER BY score DESC, evaluated DESC
LIMIT 1`;

// FalkorDB only allows shortestPath() in WITH/RETURN projections.
const shortestPathQuery = (pattern: string) => `MATCH (founder:Founder {name: "You"}),
      (targetVP:Executive {name: $buyer_name})
WITH shortestPath((founder)${pattern}(targetVP)) AS p
WHERE p IS NOT NULL
RETURN p,
       length(p) AS Hops,
       [n IN nodes(p) | coalesce(n.name, n.title)] AS PathSequence`;

const Q_SHORTEST_UNDIRECTED = shortestPathQuery("-[:BACKED_BY|EX_COLLEAGUE_AT|ALUMNI_OF*1..4]-");
const Q_SHORTEST_DIRECTED = shortestPathQuery("-[:BACKED_BY|EX_COLLEAGUE_AT|ALUMNI_OF*1..4]->");

const Q_NETWORK = `MATCH (f:Founder {name: "You"})-[b:BACKED_BY]->(i:Investor)
OPTIONAL MATCH (i)-[x:EX_COLLEAGUE_AT]->(e:Executive)
RETURN i.name AS investor, i.firm AS firm, b.round AS round,
       collect({name: e.name, title: e.title, company: x.company}) AS contacts`;

let logSeq = 0;
function log(partial: Omit<CypherLog, "id">): ScanEvent {
  return { type: "log", log: { id: `log-${Date.now()}-${logSeq++}`, ...partial } };
}

function timedLog(step: string, cypher: string, params: Record<string, unknown>, r: TimedResult<unknown>) {
  return log({
    step,
    cypher,
    params,
    serverMs: r.serverMs,
    roundTripMs: r.roundTripMs,
    rows: r.rows.length,
    status: "ok",
  });
}

function extractSignalRef(text: string): string {
  const issue = /\b(Issue|PR|Pull Request)\s*#\d+/i.exec(text);
  if (issue) return issue[0].replace(/pull request/i, "PR");
  const channel = /Discord\]?\s*#[\w-]+/i.exec(text) ?? /#[a-z][\w-]+/i.exec(text);
  if (channel) return channel[0].startsWith("#") ? `Discord ${channel[0]}` : channel[0].replace("]", "");
  return "Community signal";
}

const nodeId = (kind: NodeKind, key: string) => `${kind}:${key}`;
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export async function* runScan(input: ScanInput): AsyncGenerator<ScanEvent> {
  const text = input.text.trim();
  if (!text) {
    yield { type: "error", message: "Signal text is empty." };
    return;
  }

  let totalServer = 0;
  let totalRtt = 0;
  const track = (r: TimedResult<unknown>) => {
    totalServer += r.serverMs ?? 0;
    totalRtt += r.roundTripMs;
  };

  const signalRef = extractSignalRef(text);
  yield log({ step: "Ingest", cypher: `// signal received: ${signalRef} (${text.length} chars)`, status: "info" });

  // 1. Identity resolution: which pseudonymous account does this signal belong to?
  let handle = input.handle;
  if (!handle) {
    const r = await readQuery<{ handle: string; platform: string }>(Q_RESOLVE_HANDLE, { text });
    track(r);
    yield timedLog("Resolve pseudonymous handle", Q_RESOLVE_HANDLE, { text: `${text.slice(0, 48)}…` }, r);
    handle = r.rows[0]?.handle;
    if (!handle) {
      yield {
        type: "error",
        code: "NO_IDENTITY",
        message:
          "No known Discord/GitHub handle found in this signal. Mention a handle such as @dev_dan_99, vpc_wrangler or @ksato-sre.",
      };
      return;
    }
  }

  // 2. Multi-hop identity + hierarchy traversal: Account → Developer → Company, Executive → Developer.
  const idRes = await readQuery<Record<string, unknown>>(Q_IDENTITY, { handle });
  track(idRes);
  yield timedLog("Identity & hierarchy traversal", Q_IDENTITY, { handle }, idRes);
  const id = idRes.rows[0];
  if (!id) {
    yield {
      type: "error",
      code: "UNRESOLVED",
      message: `Handle "${handle}" exists but could not be resolved to an employed developer with a manager. Try resetting the database.`,
    };
    return;
  }

  const championName = str(id.ChampionName);
  const buyerName = str(id.BuyerName);
  const companyName = str(id.TargetCompany);

  const sibRes = await readQuery<{ platform: string; handle: string }>(Q_SIBLING_ACCOUNTS, { champion: championName });
  track(sibRes);
  yield timedLog("Cross-platform identity merge", Q_SIBLING_ACCOUNTS, { champion: championName }, sibRes);

  // 3. Commercial fit: which enterprise feature does this pain map to?
  const featRes = await readQuery<{ name: string; tier: string; acv: number; score: number }>(Q_FEATURE, {
    company: companyName,
    text,
  });
  track(featRes);
  yield timedLog("Map friction → enterprise feature", Q_FEATURE, { company: companyName, text: "…" }, featRes);
  const feat = featRes.rows[0];

  // 4. Warm-intro routing via shortestPath.
  // FalkorDB does not support undirected shortestPath, so traverse the directed
  // founder -> investor -> executive chain (edges are seeded in that direction).
  let pathRes: TimedResult<{ p: FalkorPath; Hops: number; PathSequence: string[] }>;
  let pathQuery = Q_SHORTEST_DIRECTED;
  try {
    pathRes = await readQuery(Q_SHORTEST_DIRECTED, { buyer_name: buyerName });
  } catch (err) {
    yield log({
      step: "shortestPath (directed)",
      cypher: Q_SHORTEST_DIRECTED,
      status: "info",
      note: `Retrying undirected traversal: ${err instanceof Error ? err.message : String(err)}`,
    });
    pathQuery = Q_SHORTEST_UNDIRECTED;
    pathRes = await readQuery(Q_SHORTEST_UNDIRECTED, { buyer_name: buyerName });
  }
  track(pathRes);
  yield timedLog("shortestPath warm-intro routing", pathQuery, { buyer_name: buyerName }, pathRes);
  const pathRow = pathRes.rows[0];
  if (pathRes.serverMs !== undefined) {
    yield log({
      step: "GraphBLAS",
      cypher: `// GraphBLAS sparse-matrix traversal resolved ${pathRow ? pathRow.Hops + "-hop path" : "no path"} in ${pathRes.serverMs.toFixed(2)}ms`,
      status: "info",
    });
  }

  // 5. Surrounding investor network, so the canvas shows the alternatives shortestPath rejected.
  const netRes = await readQuery<{
    investor: string;
    firm: string;
    round: string;
    contacts: { name: string | null; title: string | null; company: string | null }[];
  }>(Q_NETWORK);
  track(netRes);
  yield timedLog("Founder investor network", Q_NETWORK, {}, netRes);

  // ---- Assemble canvas graph ----
  const nodes = new Map<string, GraphNodeDTO>();
  const edges = new Map<string, GraphEdgeDTO>();
  const addNode = (n: GraphNodeDTO) => {
    const prev = nodes.get(n.id);
    // Path/champion/buyer roles outrank plain context.
    if (!prev || prev.role === "context") nodes.set(n.id, { ...prev, ...n });
  };
  const addEdge = (e: GraphEdgeDTO) => {
    const prev = edges.get(e.id);
    edges.set(e.id, { ...prev, ...e, onPath: e.onPath || prev?.onPath, identity: e.identity || prev?.identity });
  };

  const founderId = nodeId("Founder", "You");
  const buyerId = nodeId("Executive", buyerName);
  const championId = nodeId("Developer", championName);
  const companyId = nodeId("Company", companyName);

  // Path first so its roles win.
  const sequence: PathStep[] = [];
  let investor: ScanResult["investor"] = null;
  if (pathRow?.p) {
    const internal = new Map<number, string>();
    for (const n of pathRow.p.nodes) {
      const kind = (n.labels[0] ?? "Company") as NodeKind;
      const name = str(n.properties.name);
      const nid = nodeId(kind, name);
      internal.set(n.id, nid);
      const subtitle = kind === "Investor" ? str(n.properties.firm) : str(n.properties.title);
      addNode({ id: nid, kind, label: name, subtitle, role: nid === buyerId ? "buyer" : "path" });
      sequence.push({ name, kind, detail: subtitle });
      if (kind === "Investor" && !investor) {
        investor = {
          name,
          firm: str(n.properties.firm),
          email: str(n.properties.email),
          relationship: "",
        };
      }
    }
    pathRow.p.edges.forEach((e, i) => {
      const s = internal.get(e.sourceId);
      const t = internal.get(e.destinationId);
      if (!s || !t) return;
      const props = e.properties;
      const via =
        e.relationshipType === "BACKED_BY"
          ? `Backed by · ${str(props.round)}`
          : e.relationshipType === "EX_COLLEAGUE_AT"
            ? `Ex-colleagues at ${str(props.company)} (${str(props.years)})`
            : e.relationshipType;
      if (sequence[i + 1]) sequence[i + 1].via = via;
      addEdge({
        id: `${e.relationshipType}:${s}->${t}`,
        source: s,
        target: t,
        type: e.relationshipType,
        label: e.relationshipType === "EX_COLLEAGUE_AT" ? `${str(props.company)}` : str(props.round) || undefined,
        onPath: true,
      });
    });
    if (investor) {
      const idx = sequence.findIndex((s) => s.kind === "Investor");
      investor.relationship = sequence[idx + 1]?.via ?? "";
    }
  }

  addNode({ id: founderId, kind: "Founder", label: "You", subtitle: "Founder & Maintainer", role: "path" });
  addNode({ id: buyerId, kind: "Executive", label: buyerName, subtitle: str(id.BuyerTitle), role: "buyer" });
  addNode({ id: championId, kind: "Developer", label: championName, subtitle: str(id.ChampionTitle), role: "champion" });
  addNode({ id: companyId, kind: "Company", label: companyName, subtitle: `${str(id.Domain)} · ${Number(id.Employees).toLocaleString()} employees`, role: "target" });

  addEdge({ id: `MANAGES:${buyerId}->${championId}`, source: buyerId, target: championId, type: "MANAGES", identity: true });
  addEdge({ id: `EMPLOYED_BY:${championId}->${companyId}`, source: championId, target: companyId, type: "EMPLOYED_BY", identity: true });

  for (const acc of sibRes.rows) {
    const aid = nodeId("Account", `${acc.platform}:${acc.handle}`);
    addNode({
      id: aid,
      kind: "Account",
      label: acc.handle,
      subtitle: acc.platform,
      platform: acc.platform as "Discord" | "GitHub",
      role: acc.handle === handle ? "identity" : "context",
    });
    addEdge({ id: `IDENTIFIED_AS:${aid}->${championId}`, source: aid, target: championId, type: "IDENTIFIED_AS", identity: true });
  }

  if (feat) {
    const fid = nodeId("ProductFeature", feat.name);
    addNode({ id: fid, kind: "ProductFeature", label: feat.name, subtitle: `$${Number(feat.acv).toLocaleString()} ACV`, role: "target" });
    addEdge({ id: `EVALUATING:${companyId}->${fid}`, source: companyId, target: fid, type: "EVALUATING", identity: true });
  }

  for (const row of netRes.rows) {
    const iid = nodeId("Investor", row.investor);
    addNode({ id: iid, kind: "Investor", label: row.investor, subtitle: row.firm, role: "context" });
    addEdge({ id: `BACKED_BY:${founderId}->${iid}`, source: founderId, target: iid, type: "BACKED_BY", label: row.round });
    for (const c of row.contacts) {
      if (!c.name) continue;
      const eid = nodeId("Executive", c.name);
      addNode({ id: eid, kind: "Executive", label: c.name, subtitle: c.title ?? "", role: "context" });
      addEdge({ id: `EX_COLLEAGUE_AT:${iid}->${eid}`, source: iid, target: eid, type: "EX_COLLEAGUE_AT", label: c.company ?? undefined });
    }
  }

  const result: ScanResult = {
    handle,
    platform: str(id.Platform),
    signalRef,
    signalText: text,
    champion: { name: championName, email: str(id.ChampionEmail), title: str(id.ChampionTitle) },
    buyer: { name: buyerName, title: str(id.BuyerTitle), email: str(id.BuyerEmail) },
    company: { name: companyName, domain: str(id.Domain), tier: str(id.Tier), employees: Number(id.Employees) },
    feature: feat
      ? { name: feat.name, tier: feat.tier, acv: Number(feat.acv) }
      : { name: "Enterprise Support", tier: "Enterprise", acv: 0 },
    path: { hops: pathRow ? Number(pathRow.Hops) : 0, sequence },
    investor,
    graph: { nodes: [...nodes.values()], edges: [...edges.values()] },
    timings: { totalServerMs: totalServer, totalRoundTripMs: totalRtt },
  };

  yield log({
    step: "Done",
    cypher: `// ${idRes.rows.length ? "resolved" : "unresolved"} · ${result.path.hops}-hop warm path · Σ server ${totalServer.toFixed(2)}ms · Σ rtt ${totalRtt.toFixed(1)}ms`,
    status: "info",
  });
  yield { type: "result", result };
}
