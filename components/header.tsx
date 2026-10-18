"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { cn, formatMs } from "@/lib/utils";
import { Button } from "./ui/button";
import { TrojanMark } from "./icons";

export interface HealthState {
  status: "checking" | "ok" | "error";
  latencyMs?: number;
  serverMs?: number;
  nodes?: number;
  error?: string;
}

export function Header({
  health,
  resetting,
  onReset,
}: {
  health: HealthState;
  resetting: boolean;
  onReset: () => void;
}) {
  const ok = health.status === "ok";
  const checking = health.status === "checking";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10">
            <TrojanMark className="size-4 text-emerald-400" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-100">TrojanGraph</span>
        </div>
        <span className="hidden h-4 w-px bg-zinc-800 sm:block" />
        <span className="hidden rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline">
          Track 01: Connected Data
        </span>
        <span className="hidden font-mono text-[10px] text-zinc-600 md:inline">Graph Hacks · WeMakeDevs</span>
      </div>

      <div className="flex items-center gap-2">
        <div
          title={
            ok
              ? `FalkorDB Cloud · round-trip ${formatMs(health.latencyMs)} · engine ${formatMs(health.serverMs)} · ${health.nodes} nodes`
              : health.error
          }
          className={cn(
            "flex items-center gap-2 rounded-md border px-2.5 py-1 font-mono text-[10.5px]",
            ok
              ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400"
              : checking
                ? "border-zinc-800 text-zinc-400"
                : "border-red-500/30 bg-red-500/5 text-red-400",
          )}
        >
          <span className="relative flex size-1.5">
            {ok && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
            <span
              className={cn(
                "relative inline-flex size-1.5 rounded-full",
                ok ? "bg-emerald-400" : checking ? "bg-zinc-500" : "bg-red-500",
              )}
            />
          </span>
          <span className="hidden sm:inline">FalkorDB Cloud</span>
          <span className="font-semibold">
            {ok ? `CONNECTED (${formatMs(health.latencyMs, 1)})` : checking ? "CHECKING…" : "OFFLINE"}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onReset} disabled={resetting}>
          {resetting ? <Loader2 className="animate-spin" /> : <RotateCcw />}
          <span className="hidden sm:inline">Reset Database</span>
        </Button>
      </div>
    </header>
  );
}
