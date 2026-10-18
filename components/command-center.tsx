"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Database, X } from "lucide-react";
import type { Scenario } from "@/lib/scenarios";
import type { CypherLog, DraftResult, ScanEvent, ScanResult } from "@/lib/types";
import { Button } from "./ui/button";
import { DossierPanel } from "./dossier-panel";
import { GraphCanvas } from "./graph-canvas";
import { Header, type HealthState } from "./header";
import { SignalPanel } from "./signal-panel";

const STATE_KEY = "trojangraph:ui:v1";
const HEALTH_KEY = "trojangraph:health:v1";
const HEALTH_POLL_MS = 30_000;

interface Banner {
  tone: "error" | "info";
  message: string;
  action?: "reset" | "retry";
}

interface Persisted {
  selectedId: string | null;
  customText: string;
  logs: CypherLog[];
  result: ScanResult | null;
  draft: DraftResult | null;
}

export function CommandCenter() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const [manualOpen, setManualOpen] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [logs, setLogs] = useState<CypherLog[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanKey, setScanKey] = useState("initial");

  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const [health, setHealth] = useState<HealthState>({ status: "checking" });
  const [resetting, setResetting] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const hydrated = useRef(false);

  // Restore cached UI state so a refresh during a demo lands back on the last dossier instantly.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Persisted;
        setSelectedId(s.selectedId);
        setCustomText(s.customText);
        setLogs(s.logs ?? []);
        setResult(s.result);
        setDraft(s.draft);
        if (s.result) setScanKey(`restored-${Date.now()}`);
      }
      const h = localStorage.getItem(HEALTH_KEY);
      if (h) setHealth({ ...(JSON.parse(h) as HealthState), status: "checking" });
    } catch {
      localStorage.removeItem(STATE_KEY);
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current || scanning) return;
    const s: Persisted = { selectedId, customText, logs: logs.slice(-40), result, draft };
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(s));
    } catch {
      /* quota exceeded: caching is best-effort */
    }
  }, [selectedId, customText, logs, result, draft, scanning]);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        const h: HealthState = { status: "ok", latencyMs: json.latencyMs, serverMs: json.serverMs, nodes: json.nodes };
        setHealth(h);
        localStorage.setItem(HEALTH_KEY, JSON.stringify(h));
        setBanner((b) => {
          if (json.nodes === 0)
            return { tone: "info", message: "Connected, but the graph is empty. Seed the demo graph to begin.", action: "reset" };
          return b?.action === "retry" || b?.action === "reset" ? null : b;
        });
      } else {
        setHealth({ status: "error", error: json.error });
        setBanner({ tone: "error", message: json.error ?? "FalkorDB is unreachable.", action: "retry" });
      }
    } catch {
      setHealth({ status: "error", error: "Health endpoint unreachable" });
      setBanner({ tone: "error", message: "Cannot reach the TrojanGraph API.", action: "retry" });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const t = setInterval(checkHealth, HEALTH_POLL_MS);
    return () => clearInterval(t);
  }, [checkHealth]);

  const runDraft = useCallback(async (r: ScanResult) => {
    setDrafting(true);
    setDraftError(null);
    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(r),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Draft failed");
      setDraft(json as DraftResult);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Draft failed");
    } finally {
      setDrafting(false);
    }
  }, []);

  const execute = useCallback(async () => {
    const text = customText.trim();
    if (!text || scanning) return;
    setScanning(true);
    setLogs([]);
    setResult(null);
    setDraft(null);
    setDraftError(null);
    setBanner((b) => (b?.tone === "error" && b.action !== "retry" ? null : b));

    let final: ScanResult | null = null;
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.body) throw new Error("Empty response from /api/scan");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const event = JSON.parse(line) as ScanEvent;
          if (event.type === "log") setLogs((l) => [...l, event.log]);
          else if (event.type === "result") final = event.result;
          else if (event.type === "error") {
            setLogs((l) => [
              ...l,
              { id: `log-${Date.now()}-err`, step: "Scan aborted", cypher: `// ${event.message}`, status: "error" },
            ]);
            const connection = event.code === "CONNECT_FAILED" || event.code === "CONNECT_TIMEOUT" || event.code === "NOT_CONFIGURED";
            setBanner({ tone: connection ? "error" : "info", message: event.message, action: connection ? "retry" : undefined });
            if (connection) setHealth({ status: "error", error: event.message });
          }
        }
      }
    } catch (err) {
      setBanner({ tone: "error", message: err instanceof Error ? err.message : "Scan failed", action: "retry" });
    } finally {
      setScanning(false);
    }

    if (final) {
      setResult(final);
      setScanKey(`scan-${Date.now()}`);
      runDraft(final);
    }
  }, [customText, scanning, runDraft]);

  const reset = useCallback(async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? "Reset failed");
      setResult(null);
      setDraft(null);
      setScanKey(`reset-${Date.now()}`);
      const now = Date.now();
      const seedLogs: CypherLog[] = (
        json.steps as { step: string; cypher: string; serverMs?: number; roundTripMs: number }[]
      ).map((s, i) => ({
        id: `log-${now}-seed${i}`,
        step: `Seed · ${s.step}`,
        cypher: s.cypher,
        serverMs: s.serverMs ?? 0,
        roundTripMs: s.roundTripMs,
        status: "ok",
      }));
      seedLogs.push({
        id: `log-${now}-seeddone`,
        step: "Seed complete",
        cypher: `// idempotent MERGE seed · ${json.nodes} nodes · ${json.edges} relationships`,
        status: "info",
      });
      setLogs(seedLogs);
      setBanner(null);
      checkHealth();
    } catch (err) {
      setBanner({ tone: "error", message: err instanceof Error ? err.message : "Reset failed", action: "retry" });
    } finally {
      setResetting(false);
    }
  }, [checkHealth]);

  const selectScenario = (s: Scenario) => {
    setSelectedId(s.id);
    setCustomText(s.text);
  };

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-100">
      <Header health={health} resetting={resetting} onReset={reset} />

      {banner && (
        <div
          className={
            banner.tone === "error"
              ? "flex items-center gap-3 border-b border-red-500/20 bg-red-500/[0.07] px-4 py-2 text-xs text-red-200"
              : "flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/[0.06] px-4 py-2 text-xs text-amber-100"
          }
        >
          {banner.tone === "error" ? <AlertTriangle className="size-3.5 shrink-0" /> : <Database className="size-3.5 shrink-0" />}
          <span className="min-w-0 flex-1 truncate">{banner.message}</span>
          {banner.action === "retry" && (
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={checkHealth}>
              Retry connection
            </Button>
          )}
          {banner.action === "reset" && (
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={reset} disabled={resetting}>
              Seed demo graph
            </Button>
          )}
          <button onClick={() => setBanner(null)} className="cursor-pointer opacity-60 hover:opacity-100" aria-label="Dismiss">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <main className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[28fr_44fr_28fr] lg:overflow-hidden">
        <section className="min-h-0 border-zinc-800/80 lg:border-r">
          <SignalPanel
            selectedId={selectedId}
            customText={customText}
            manualOpen={manualOpen}
            scanning={scanning}
            logs={logs}
            onSelect={selectScenario}
            onCustomText={(t) => {
              setCustomText(t);
              setSelectedId(null);
            }}
            onToggleManual={() => setManualOpen((o) => !o)}
            onExecute={execute}
          />
        </section>
        <section className="h-[560px] min-h-0 border-y border-zinc-800/80 lg:h-auto lg:border-y-0">
          <GraphCanvas
            nodes={result?.graph.nodes ?? []}
            edges={result?.graph.edges ?? []}
            scanKey={scanKey}
            scanning={scanning}
            hops={result?.path.hops}
          />
        </section>
        <section className="min-h-0 border-zinc-800/80 lg:border-l">
          <DossierPanel
            result={result}
            draft={draft}
            drafting={drafting}
            draftError={draftError}
            scanning={scanning}
            onRedraft={() => result && runDraft(result)}
          />
        </section>
      </main>
    </div>
  );
}
