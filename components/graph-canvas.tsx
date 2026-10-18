"use client";

import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Network, Loader2 } from "lucide-react";
import type { GraphEdgeDTO, GraphNodeDTO } from "@/lib/types";
import { GraphEntityNode, type EntityNode } from "./graph-node";

const nodeTypes = { entity: GraphEntityNode };

const X_GAP = 200;
const Y_GAP = 112;

const EMERALD = "#10b981";
const VIOLET = "#8b5cf6";
const MUTED = "#3f3f46";

/** Deterministic layered layout: longest-path ranks from the founder, barycenter ordering within ranks. */
function layout(nodes: GraphNodeDTO[], edges: GraphEdgeDTO[]) {
  const rank = new Map<string, number>();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const founder = nodes.find((n) => n.kind === "Founder");
  if (founder) rank.set(founder.id, 0);

  const flowEdges = edges.filter((e) => byId.get(e.source)?.kind !== "Account");
  for (let i = 0; i < nodes.length; i++) {
    let changed = false;
    for (const e of flowEdges) {
      const rs = rank.get(e.source);
      if (rs === undefined) continue;
      if ((rank.get(e.target) ?? -1) < rs + 1) {
        rank.set(e.target, rs + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (const e of edges) {
    if (byId.get(e.source)?.kind === "Account") rank.set(e.source, (rank.get(e.target) ?? 0) + 1);
  }
  const maxRank = Math.max(0, ...rank.values());
  for (const n of nodes) if (!rank.has(n.id)) rank.set(n.id, maxRank + 1);

  const rows = new Map<number, GraphNodeDTO[]>();
  for (const n of nodes) {
    const r = rank.get(n.id)!;
    rows.set(r, [...(rows.get(r) ?? []), n]);
  }

  const neighbors = new Map<string, string[]>();
  for (const e of edges) {
    neighbors.set(e.source, [...(neighbors.get(e.source) ?? []), e.target]);
    neighbors.set(e.target, [...(neighbors.get(e.target) ?? []), e.source]);
  }

  const pos = new Map<string, { x: number; y: number }>();
  const roleWeight = (n: GraphNodeDTO) => (n.role === "context" ? 1 : 0);
  for (const r of [...rows.keys()].sort((a, b) => a - b)) {
    const row = rows.get(r)!;
    const bary = (n: GraphNodeDTO) => {
      const xs = (neighbors.get(n.id) ?? []).map((id) => pos.get(id)?.x).filter((x): x is number => x !== undefined);
      return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
    };
    row.sort((a, b) => bary(a) - bary(b) || roleWeight(a) - roleWeight(b) || a.label.localeCompare(b.label));
    const width = (row.length - 1) * X_GAP;
    row.forEach((n, i) => pos.set(n.id, { x: i * X_GAP - width / 2, y: r * Y_GAP }));
  }
  return { pos, rank };
}

function buildFlow(nodes: GraphNodeDTO[], edges: GraphEdgeDTO[]) {
  const { pos, rank } = layout(nodes, edges);
  const flowNodes: EntityNode[] = nodes.map((n) => ({
    id: n.id,
    type: "entity",
    position: { x: pos.get(n.id)!.x - 88, y: pos.get(n.id)!.y },
    data: { ...n, delay: (rank.get(n.id) ?? 0) * 110, dimmed: n.role === "context" },
  }));

  const flowEdges: Edge[] = edges.map((e) => {
    const color = e.onPath ? EMERALD : e.identity ? VIOLET : MUTED;
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      animated: !!e.onPath,
      className: e.onPath ? "tg-edge-path" : undefined,
      label: e.onPath ? e.label || e.type : e.identity ? e.type : undefined,
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 3,
      zIndex: e.onPath ? 10 : e.identity ? 5 : 0,
      style: {
        stroke: color,
        strokeWidth: e.onPath ? 2.25 : e.identity ? 1.4 : 1,
        strokeDasharray: e.identity && !e.onPath ? "4 3" : undefined,
        opacity: e.onPath || e.identity ? 1 : 0.6,
      },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
    };
  });
  return { flowNodes, flowEdges };
}

interface Props {
  nodes: GraphNodeDTO[];
  edges: GraphEdgeDTO[];
  scanKey: string;
  scanning: boolean;
  hops?: number;
}

export function GraphCanvas({ nodes, edges, scanKey, scanning, hops }: Props) {
  const { flowNodes, flowEdges } = useMemo(() => buildFlow(nodes, edges), [nodes, edges]);
  const empty = nodes.length === 0;

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Network className="size-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-300">Connected Context Graph</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-500">
          {!empty && (
            <>
              <span>{nodes.length} nodes</span>
              <span>{edges.length} edges</span>
              {hops ? <span className="text-emerald-400">{hops}-hop shortestPath</span> : null}
            </>
          )}
        </div>
      </div>

      <div className="relative flex-1">
        <ReactFlowProvider>
          <ReactFlow
            key={scanKey}
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.18, maxZoom: 1.1 }}
            minZoom={0.25}
            maxZoom={1.75}
            nodesConnectable={false}
            proOptions={{ hideAttribution: true }}
            colorMode="dark"
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="#27272a" />
            {!empty && <Controls showInteractive={false} position="bottom-right" />}
          </ReactFlow>
        </ReactFlowProvider>

        {empty && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
            {scanning ? (
              <>
                <Loader2 className="size-5 animate-spin text-violet-400" />
                <p className="font-mono text-xs text-violet-300">Traversing FalkorDB…</p>
              </>
            ) : (
              <>
                <div className="flex size-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80">
                  <Network className="size-4 text-zinc-500" />
                </div>
                <div>
                  <p className="text-sm text-zinc-300">No traversal yet</p>
                  <p className="mt-1 max-w-[260px] text-xs text-zinc-500">
                    Pick a signal on the left and run an infiltration scan to resolve the buyer graph.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {!empty && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-950/80 px-2.5 py-2 font-mono text-[9.5px] text-zinc-400 backdrop-blur">
            <LegendRow color={EMERALD} label="Warm-intro path (shortestPath)" glow />
            <LegendRow color={VIOLET} label="Identity resolution" dashed />
            <LegendRow color={MUTED} label="Investor network" />
          </div>
        )}
      </div>
    </div>
  );
}

function LegendRow({ color, label, dashed, glow }: { color: string; label: string; dashed?: boolean; glow?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="18" height="4" aria-hidden>
        <line
          x1="0"
          y1="2"
          x2="18"
          y2="2"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? "3 2" : undefined}
          style={glow ? { filter: `drop-shadow(0 0 3px ${color})` } : undefined}
        />
      </svg>
      {label}
    </div>
  );
}
