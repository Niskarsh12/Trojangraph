export type NodeKind =
  | "Founder"
  | "Investor"
  | "Executive"
  | "Company"
  | "Developer"
  | "Account"
  | "ProductFeature";

export type GraphNodeDTO = {
  id: string;
  kind: NodeKind;
  label: string;
  subtitle?: string;
  platform?: "Discord" | "GitHub";
  /** Role this node plays in the resolved deal: shapes styling on the canvas. */
  role?: "path" | "champion" | "buyer" | "identity" | "target" | "context";
};

export interface GraphEdgeDTO {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  onPath?: boolean;
  identity?: boolean;
}

export interface CypherLog {
  id: string;
  step: string;
  cypher: string;
  params?: Record<string, unknown>;
  /** FalkorDB-reported internal execution time (GraphBLAS engine). */
  serverMs?: number;
  /** Round-trip time measured by the API route, network included. */
  roundTripMs?: number;
  rows?: number;
  note?: string;
  status: "ok" | "error" | "info";
}

export interface PathStep {
  name: string;
  kind: NodeKind;
  detail: string;
  via?: string;
}

export interface ScanResult {
  handle: string;
  platform: string;
  signalRef: string;
  signalText: string;
  champion: { name: string; email: string; title: string };
  buyer: { name: string; title: string; email: string };
  company: { name: string; domain: string; tier: string; employees: number };
  feature: { name: string; tier: string; acv: number };
  path: { hops: number; sequence: PathStep[] };
  investor: { name: string; firm: string; email: string; relationship: string } | null;
  graph: { nodes: GraphNodeDTO[]; edges: GraphEdgeDTO[] };
  timings: { totalServerMs: number; totalRoundTripMs: number };
}

export type ScanEvent =
  | { type: "log"; log: CypherLog }
  | { type: "result"; result: ScanResult }
  | { type: "error"; message: string; code?: string };

export interface DraftResult {
  subject: string;
  body: string;
  source: "openai" | "template";
  model?: string;
}
