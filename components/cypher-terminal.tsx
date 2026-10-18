"use client";

import { useEffect, useRef } from "react";
import { TerminalSquare } from "lucide-react";
import type { CypherLog } from "@/lib/types";
import { cn, formatMs } from "@/lib/utils";

const KEYWORDS =
  /\b(MATCH|OPTIONAL|WHERE|RETURN|WITH|UNWIND|MERGE|SET|ORDER BY|LIMIT|AS|AND|OR|CASE|WHEN|THEN|ELSE|END|IS NOT NULL|IS|NOT|NULL|CONTAINS|DESC|IN|DETACH DELETE|CREATE INDEX FOR|ON)\b/g;
const FUNCTIONS = /\b(shortestPath|collect|size|toLower|coalesce|nodes|length|count)\b(?=\()/g;

function highlight(line: string, key: string) {
  if (line.trimStart().startsWith("//")) {
    return <span className="text-emerald-400/90">{line}</span>;
  }
  const html = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/(\$\w+)/g, '<span class="text-amber-300">$1</span>')
    .replace(/(:[A-Z][A-Za-z_]*(\|[A-Z_]+)*)/g, '<span class="text-sky-300">$1</span>')
    .replace(FUNCTIONS, '<span class="text-emerald-300">$1</span>')
    .replace(KEYWORDS, '<span class="text-violet-400">$1</span>');
  return <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
}

function timestamp(id: string) {
  const ms = Number(id.split("-")[1]);
  if (!ms) return "";
  const d = new Date(ms);
  return `${d.toLocaleTimeString("en-GB", { hour12: false })}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

export function CypherTerminal({ logs, running }: { logs: CypherLog[]; running: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [logs.length]);

  const totalServer = logs.reduce((s, l) => s + (l.serverMs ?? 0), 0);
  const queries = logs.filter((l) => l.serverMs !== undefined).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-black/60">
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <TerminalSquare className="size-3.5 text-zinc-500" />
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">Cypher Execution Log</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
          <span>{queries} queries</span>
          <span className="text-emerald-400">Σ {formatMs(totalServer)}</span>
        </div>
      </div>

      <div ref={scrollRef} className="tg-scroll min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 font-mono text-[10.5px] leading-relaxed">
        {logs.length === 0 && !running && (
          <div className="text-zinc-600">
            <span className="text-emerald-500">falkordb@cloud</span>:~$ awaiting signal
            <span className="tg-cursor ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-zinc-500" />
          </div>
        )}

        {logs.map((l) => (
          <div key={l.id} className="tg-log-enter">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="text-zinc-600">{timestamp(l.id)}</span>
                <span
                  className={cn(
                    "truncate",
                    l.status === "error" ? "text-red-400" : l.status === "info" ? "text-zinc-400" : "text-zinc-200",
                  )}
                >
                  {l.status === "error" ? "✕" : "▸"} {l.step}
                </span>
              </div>
              {l.serverMs !== undefined && (
                <span className="shrink-0 text-emerald-400">
                  {formatMs(l.serverMs)}
                  <span className="text-zinc-600"> · rtt {formatMs(l.roundTripMs, 0)}</span>
                  {l.rows !== undefined && <span className="text-zinc-600"> · {l.rows}r</span>}
                </span>
              )}
            </div>
            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words border-l border-zinc-800 pl-2.5 text-zinc-400">
              {l.cypher.split("\n").map((line, i) => (
                <div key={i}>{highlight(line, `${l.id}-${i}`)}</div>
              ))}
            </pre>
            {l.params && Object.keys(l.params).length > 0 && (
              <div className="mt-0.5 pl-2.5 text-zinc-600">params {JSON.stringify(l.params)}</div>
            )}
            {l.note && <div className="mt-0.5 pl-2.5 text-amber-400/80">{l.note}</div>}
          </div>
        ))}

        {running && (
          <div className="flex items-center gap-1.5 text-violet-300">
            <span className="size-1.5 animate-pulse rounded-full bg-violet-400" />
            agent traversing graph
            <span className="tg-cursor inline-block h-3 w-1.5 bg-violet-400" />
          </div>
        )}
      </div>
    </div>
  );
}
