import { FalkorDB, type Graph } from "falkordb";

const GRAPH_NAME = process.env.FALKORDB_GRAPH || "trojangraph";
const CONNECT_TIMEOUT_MS = 8_000;
const QUERY_TIMEOUT_MS = 5_000;

export class GraphUnavailableError extends Error {
  code: "NOT_CONFIGURED" | "CONNECT_TIMEOUT" | "CONNECT_FAILED";
  constructor(code: GraphUnavailableError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

// Survive Next.js dev-mode hot reloads without leaking TCP/TLS sockets.
const globalForDb = globalThis as unknown as {
  __falkor?: Promise<FalkorDB>;
};

function withTimeout<T>(p: Promise<T>, ms: number, onTimeout: () => Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(onTimeout()), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function connect(): Promise<FalkorDB> {
  const url = process.env.FALKORDB_URL;
  if (!url) {
    throw new GraphUnavailableError(
      "NOT_CONFIGURED",
      "FALKORDB_URL is not set. Add your FalkorDB Cloud connection string to .env.local.",
    );
  }

  const db = await withTimeout(
    FalkorDB.connect({
      url,
      socket: { connectTimeout: CONNECT_TIMEOUT_MS },
      pingInterval: 30_000,
    }),
    CONNECT_TIMEOUT_MS,
    () => new GraphUnavailableError("CONNECT_TIMEOUT", "Timed out connecting to FalkorDB Cloud."),
  ).catch((err) => {
    if (err instanceof GraphUnavailableError) throw err;
    throw new GraphUnavailableError(
      "CONNECT_FAILED",
      `Could not connect to FalkorDB: ${err instanceof Error ? err.message : String(err)}`,
    );
  });

  // Socket errors are emitted asynchronously; without a listener Node would crash the process.
  db.on("error", (err: unknown) => {
    console.error("[falkordb] connection error", err);
  });
  return db;
}

export async function getDb(): Promise<FalkorDB> {
  if (!globalForDb.__falkor) {
    globalForDb.__falkor = connect().catch((err) => {
      globalForDb.__falkor = undefined;
      throw err;
    });
  }
  return globalForDb.__falkor;
}

export async function getGraph(): Promise<Graph> {
  const db = await getDb();
  return db.selectGraph(GRAPH_NAME);
}

export function resetConnection() {
  const pending = globalForDb.__falkor;
  globalForDb.__falkor = undefined;
  pending?.then((db) => db.close()).catch(() => {});
}

/** Parses FalkorDB's "Query internal execution time: 0.42 milliseconds" metadata line. */
export function serverTimeMs(metadata: unknown): number | undefined {
  if (!Array.isArray(metadata)) return undefined;
  for (const line of metadata) {
    const m = /execution time:\s*([\d.]+)\s*milliseconds/i.exec(String(line));
    if (m) return Number(m[1]);
  }
  return undefined;
}

export interface TimedResult<T> {
  rows: T[];
  serverMs?: number;
  roundTripMs: number;
}

type QueryParam = null | string | number | boolean | QueryParam[] | { [key: string]: QueryParam };
type Params = Record<string, QueryParam>;

/** Read-only traversal: routed through GRAPH.RO_QUERY so it can never mutate the graph. */
export async function readQuery<T>(cypher: string, params?: Params): Promise<TimedResult<T>> {
  const graph = await getGraph();
  const t0 = performance.now();
  const res = await graph.roQuery<T>(cypher, { params, TIMEOUT: QUERY_TIMEOUT_MS });
  return {
    rows: res.data ?? [],
    serverMs: serverTimeMs(res.metadata),
    roundTripMs: performance.now() - t0,
  };
}

export async function writeQuery<T>(cypher: string, params?: Params): Promise<TimedResult<T>> {
  const graph = await getGraph();
  const t0 = performance.now();
  const res = await graph.query<T>(cypher, { params, TIMEOUT: QUERY_TIMEOUT_MS * 4 });
  return {
    rows: res.data ?? [],
    serverMs: serverTimeMs(res.metadata),
    roundTripMs: performance.now() - t0,
  };
}

export function describeError(err: unknown): { message: string; code?: string } {
  if (err instanceof GraphUnavailableError) return { message: err.message, code: err.code };
  const message = err instanceof Error ? err.message : String(err);
  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Socket closed|connection/i.test(message)) {
    resetConnection();
    return { message: `FalkorDB connection lost: ${message}`, code: "CONNECT_FAILED" };
  }
  return { message };
}
