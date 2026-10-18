"use client";

import { useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Check,
  Code2,
  Copy,
  Crown,
  FileText,
  Landmark,
  Loader2,
  Mail,
  RefreshCw,
  Rocket,
  Send,
  Sparkles,
} from "lucide-react";
import type { DraftResult, NodeKind, ScanResult } from "@/lib/types";
import { cn, formatUsd } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, SectionLabel } from "./ui/card";

interface Props {
  result: ScanResult | null;
  draft: DraftResult | null;
  drafting: boolean;
  draftError: string | null;
  scanning: boolean;
  onRedraft: () => void;
}

const STEP_ICON: Partial<Record<NodeKind, React.ElementType>> = {
  Founder: Rocket,
  Investor: Landmark,
  Executive: Crown,
};

export function DossierPanel({ result, draft, drafting, draftError, scanning, onRedraft }: Props) {
  const [copied, setCopied] = useState(false);
  const [push, setPush] = useState<{ state: "idle" | "sending" | "done" | "error"; msg?: string }>({ state: "idle" });

  if (!result) {
    return (
      <div className="flex h-full flex-col p-4">
        <SectionLabel>03 · Enterprise Dossier</SectionLabel>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          {scanning ? (
            <>
              <Loader2 className="size-5 animate-spin text-violet-400" />
              <p className="font-mono text-xs text-violet-300">Resolving economic buyer…</p>
            </>
          ) : (
            <>
              <div className="flex size-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80">
                <Briefcase className="size-4 text-zinc-500" />
              </div>
              <p className="text-sm text-zinc-300">No dossier yet</p>
              <p className="max-w-[240px] text-xs text-zinc-500">
                The agent will identify the champion, the budget holder and the warmest route to them.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  const briefing = buildBriefing(result, draft);

  const copy = async () => {
    await navigator.clipboard.writeText(briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const pushOut = async () => {
    setPush({ state: "sending" });
    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefing, company: result.company.name }),
      });
      const json = await res.json();
      setPush(json.ok ? { state: "done", msg: json.message } : { state: "error", msg: json.error });
    } catch {
      setPush({ state: "error", msg: "Network error" });
    }
  };

  return (
    <div className="tg-scroll flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <SectionLabel>03 · Enterprise Dossier</SectionLabel>
        <Badge variant="emerald">Resolved</Badge>
      </div>

      {/* Target account */}
      <Card className="p-3.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Target Account</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-zinc-100">{result.company.name}</div>
            <div className="font-mono text-[10.5px] text-zinc-500">
              {result.company.domain} · {result.company.employees.toLocaleString()} employees
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Est. ACV</div>
            <div className="mt-1 text-lg font-semibold tabular-nums text-emerald-400">
              {formatUsd(result.feature.acv)}
              <span className="text-xs font-normal text-zinc-500">/yr</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5">
          <Sparkles className="size-3 text-emerald-400" />
          <span className="text-[11px] text-zinc-300">{result.feature.name}</span>
          <Badge className="ml-auto">{result.feature.tier}</Badge>
        </div>
      </Card>

      {/* Champion vs buyer */}
      <div className="grid grid-cols-2 gap-2">
        <PersonCard
          tone="violet"
          icon={Code2}
          role="Technical Champion"
          name={result.champion.name}
          title={result.champion.title}
          meta={`@${result.handle} · ${result.platform}`}
          foot="Feeling the pain"
        />
        <PersonCard
          tone="amber"
          icon={Crown}
          role="Economic Buyer"
          name={result.buyer.name}
          title={result.buyer.title}
          meta={result.buyer.email}
          foot="Holds the budget"
        />
      </div>

      {/* Path breakdown */}
      <Card className="p-3.5">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">Warm Intro Path</div>
          <Badge variant={result.path.hops ? "emerald" : "red"}>
            {result.path.hops ? `${result.path.hops} hops · shortestPath` : "No path ≤ 4 hops"}
          </Badge>
        </div>
        {result.path.sequence.length > 0 ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {result.path.sequence.map((s, i) => (
                <span key={s.name} className="flex items-center gap-1.5">
                  {i > 0 && <ArrowRight className="size-3 text-emerald-500" />}
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 text-[11px]",
                      i === result.path.sequence.length - 1
                        ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
                    )}
                  >
                    {s.name === "You" ? "Founder" : s.name}
                  </span>
                </span>
              ))}
            </div>
            <ol className="mt-3 space-y-0">
              {result.path.sequence.map((s, i) => {
                const Icon = STEP_ICON[s.kind] ?? Crown;
                const last = i === result.path.sequence.length - 1;
                return (
                  <li key={s.name} className="relative flex gap-2.5 pb-3 last:pb-0">
                    {!last && <span className="absolute left-[11px] top-6 h-[calc(100%-18px)] w-px bg-emerald-500/30" />}
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10">
                      <Icon className="size-3 text-emerald-400" />
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <div className="text-xs text-zinc-100">
                        {s.name === "You" ? "You (Founder)" : s.name}
                        <span className="text-zinc-500"> · {s.detail}</span>
                      </div>
                      {s.via && <div className="mt-0.5 font-mono text-[10px] text-emerald-400/80">{s.via}</div>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">
            No investor or alumni connection reaches {result.buyer.name} within 4 hops. Go direct via the champion.
          </p>
        )}
      </Card>

      {/* Email */}
      <Card className="flex flex-col p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            <Mail className="size-3" /> Warm Intro Draft
          </div>
          <div className="flex items-center gap-1.5">
            {draft && (
              <Badge variant={draft.source === "openai" ? "violet" : "default"}>
                {draft.source === "openai" ? draft.model ?? "LLM" : "Template"}
              </Badge>
            )}
            <button
              onClick={onRedraft}
              disabled={drafting}
              title="Regenerate"
              className="cursor-pointer rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
            >
              <RefreshCw className={cn("size-3", drafting && "animate-spin")} />
            </button>
          </div>
        </div>

        {drafting && !draft ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 font-mono text-[10.5px] text-violet-300">
              <Sparkles className="size-3 animate-pulse" /> Synthesizing from graph facts…
            </div>
            {[90, 100, 75, 95, 60].map((w, i) => (
              <div key={i} className="tg-shimmer h-2.5 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : draft ? (
          <div className={cn("mt-3 rounded-lg border border-zinc-800 bg-zinc-950/70", drafting && "opacity-50")}>
            <div className="space-y-0.5 border-b border-zinc-800 px-3 py-2 text-[11px]">
              <div className="flex gap-2">
                <span className="w-12 text-zinc-600">From</span>
                <span className="truncate text-zinc-300">
                  {result.investor ? `${result.investor.name} <${result.investor.email}>` : "You"}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="w-12 text-zinc-600">To</span>
                <span className="truncate text-zinc-300">
                  {result.buyer.name} &lt;{result.buyer.email}&gt;
                </span>
              </div>
              <div className="flex gap-2">
                <span className="w-12 text-zinc-600">Subject</span>
                <span className="truncate font-medium text-zinc-100">{draft.subject}</span>
              </div>
            </div>
            <div className="whitespace-pre-wrap px-3 py-2.5 text-[12px] leading-relaxed text-zinc-300">{draft.body}</div>
          </div>
        ) : draftError ? (
          <p className="mt-3 text-xs text-red-300">{draftError}</p>
        ) : null}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={copy} disabled={!draft}>
          {copied ? <Check className="text-emerald-400" /> : <Copy />}
          {copied ? "Copied" : "Copy Briefing"}
        </Button>
        <Button variant="outline" size="sm" onClick={pushOut} disabled={!draft || push.state === "sending"}>
          {push.state === "sending" ? <Loader2 className="animate-spin" /> : push.state === "done" ? <Check className="text-emerald-400" /> : <Send />}
          Push to Slack / HubSpot
        </Button>
      </div>
      {push.msg && (
        <p className={cn("-mt-1 font-mono text-[10px]", push.state === "error" ? "text-amber-400" : "text-emerald-400")}>
          {push.msg}
        </p>
      )}
      <div className="flex items-center gap-1.5 pb-1 font-mono text-[9.5px] text-zinc-600">
        <FileText className="size-3" />
        Every fact above was produced by FalkorDB traversals; the LLM only phrases it.
      </div>
    </div>
  );
}

function PersonCard({
  tone,
  icon: Icon,
  role,
  name,
  title,
  meta,
  foot,
}: {
  tone: "violet" | "amber";
  icon: React.ElementType;
  role: string;
  name: string;
  title: string;
  meta: string;
  foot: string;
}) {
  const t =
    tone === "violet"
      ? { border: "border-violet-500/30", text: "text-violet-300", bg: "bg-violet-500/10" }
      : { border: "border-amber-400/30", text: "text-amber-300", bg: "bg-amber-400/10" };
  return (
    <Card className={cn("p-3", t.border)}>
      <div className={cn("flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wider", t.text)}>
        <span className={cn("flex size-4 items-center justify-center rounded", t.bg)}>
          <Icon className="size-2.5" />
        </span>
        {role}
      </div>
      <div className="mt-2 truncate text-[13px] font-medium text-zinc-100">{name}</div>
      <div className="truncate text-[11px] text-zinc-400">{title}</div>
      <div className="mt-1.5 truncate font-mono text-[9.5px] text-zinc-500">{meta}</div>
      <div className="mt-2 border-t border-zinc-800 pt-1.5 text-[10px] text-zinc-500">{foot}</div>
    </Card>
  );
}

function buildBriefing(r: ScanResult, d: DraftResult | null) {
  const path = r.path.sequence.map((s) => (s.name === "You" ? "Founder" : s.name)).join(" -> ");
  return [
    `TROJANGRAPH BRIEFING: ${r.company.name}`,
    ``,
    `Signal: ${r.signalRef} via ${r.platform} (@${r.handle})`,
    `Target: ${r.company.name} (${r.company.domain}), est. ACV ${formatUsd(r.feature.acv)}/yr for ${r.feature.name}`,
    `Champion: ${r.champion.name}, ${r.champion.title} <${r.champion.email}>`,
    `Economic Buyer: ${r.buyer.name}, ${r.buyer.title} <${r.buyer.email}>`,
    `Warm path (${r.path.hops} hops): ${path || "none"}`,
    ``,
    ...(d ? [`Subject: ${d.subject}`, ``, d.body] : []),
  ].join("\n");
}
