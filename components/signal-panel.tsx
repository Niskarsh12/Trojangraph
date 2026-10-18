"use client";

import { ChevronDown, Crosshair, Loader2, PenLine } from "lucide-react";
import { SCENARIOS, type Scenario } from "@/lib/scenarios";
import type { CypherLog } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { SectionLabel } from "./ui/card";
import { CypherTerminal } from "./cypher-terminal";
import { DiscordIcon, GitHubIcon } from "./icons";

interface Props {
  selectedId: string | null;
  customText: string;
  manualOpen: boolean;
  scanning: boolean;
  logs: CypherLog[];
  onSelect: (s: Scenario) => void;
  onCustomText: (t: string) => void;
  onToggleManual: () => void;
  onExecute: () => void;
}

export function SignalPanel({
  selectedId,
  customText,
  manualOpen,
  scanning,
  logs,
  onSelect,
  onCustomText,
  onToggleManual,
  onExecute,
}: Props) {
  const ready = !!selectedId || customText.trim().length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <SectionLabel>01 · Signal Ingestion</SectionLabel>
        <span className="font-mono text-[10px] text-zinc-600">GitHub · Discord</span>
      </div>

      <div className="flex flex-col gap-2">
        {SCENARIOS.map((s, i) => {
          const active = selectedId === s.id;
          const Icon = s.channel === "Discord" ? DiscordIcon : GitHubIcon;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={cn(
                "group relative w-full cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-all",
                active
                  ? "border-emerald-500/50 bg-emerald-500/[0.06] shadow-[0_0_0_1px_rgb(16_185_129/0.15)]"
                  : "border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-zinc-600">0{i + 1}</span>
                  <span className="text-[13px] font-medium text-zinc-100">{s.company}</span>
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1 rounded border px-1.5 py-px font-mono text-[9.5px]",
                    active ? "border-emerald-500/30 text-emerald-300" : "border-zinc-800 text-zinc-400",
                  )}
                >
                  <Icon className="size-2.5" />
                  {s.ref}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-zinc-400">{s.title}</p>
              <p className="mt-1 font-mono text-[10px] text-zinc-600">@{s.author}</p>
              {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-emerald-400" />}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40">
        <button
          onClick={onToggleManual}
          className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200"
        >
          <span className="flex items-center gap-2">
            <PenLine className="size-3.5" />
            {selectedId ? "Inspect / edit signal payload" : "Paste custom GitHub / Discord text"}
          </span>
          <ChevronDown className={cn("size-3.5 transition-transform", manualOpen && "rotate-180")} />
        </button>
        {manualOpen && (
          <div className="border-t border-zinc-800/80 p-2">
            <textarea
              value={customText}
              onChange={(e) => onCustomText(e.target.value)}
              rows={6}
              placeholder="e.g. [Discord] #help — dan_in_the_cloud: our replicas keep timing out during failover…"
              className="tg-scroll w-full resize-none rounded-md border border-zinc-800 bg-zinc-950/80 p-2 font-mono text-[11px] leading-relaxed text-zinc-300 placeholder:text-zinc-600 focus:border-emerald-500/40 focus:outline-none"
            />
            <p className="mt-1 font-mono text-[9.5px] text-zinc-600">
              Handles are resolved inside FalkorDB. Known: dev_dan_99, dan_in_the_cloud, vpc_wrangler, ksato-sre, lpark-sre
            </p>
          </div>
        )}
      </div>

      <Button variant="primary" size="lg" onClick={onExecute} disabled={!ready || scanning} className="w-full">
        {scanning ? <Loader2 className="animate-spin" /> : <Crosshair />}
        {scanning ? "Infiltrating graph…" : "Execute Infiltration Scan"}
      </Button>

      <CypherTerminal logs={logs} running={scanning} />
    </div>
  );
}
