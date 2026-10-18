"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Boxes, Building2, Code2, Crown, Landmark, Rocket } from "lucide-react";
import type { GraphNodeDTO, NodeKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DiscordIcon, GitHubIcon } from "./icons";

export type EntityNodeData = GraphNodeDTO & { delay: number; dimmed: boolean };
export type EntityNode = Node<EntityNodeData, "entity">;

const KIND_STYLE: Record<NodeKind, { icon: React.ElementType; badge: string; tone: string }> = {
  Founder: { icon: Rocket, badge: "Founder", tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  Investor: { icon: Landmark, badge: "VC", tone: "text-sky-300 bg-sky-500/10 border-sky-500/30" },
  Executive: { icon: Crown, badge: "VP", tone: "text-amber-300 bg-amber-500/10 border-amber-500/30" },
  Developer: { icon: Code2, badge: "Dev", tone: "text-violet-300 bg-violet-500/10 border-violet-500/30" },
  Company: { icon: Building2, badge: "Target", tone: "text-zinc-200 bg-zinc-500/10 border-zinc-600/40" },
  Account: { icon: GitHubIcon, badge: "Handle", tone: "text-zinc-300 bg-zinc-500/10 border-zinc-600/40" },
  ProductFeature: { icon: Boxes, badge: "SKU", tone: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
};

const ROLE_RING: Partial<Record<NonNullable<GraphNodeDTO["role"]>, string>> = {
  path: "border-emerald-500/60 shadow-[0_0_24px_-6px_rgb(16_185_129/0.7)]",
  buyer: "border-amber-400/70 shadow-[0_0_28px_-6px_rgb(251_191_36/0.6)]",
  champion: "border-violet-400/70 shadow-[0_0_24px_-6px_rgb(139_92_246/0.7)]",
  identity: "border-violet-500/50",
  target: "border-zinc-600",
};

const ROLE_TAG: Partial<Record<NonNullable<GraphNodeDTO["role"]>, { text: string; cls: string }>> = {
  buyer: { text: "Economic Buyer", cls: "bg-amber-400 text-zinc-950" },
  champion: { text: "Champion", cls: "bg-violet-400 text-zinc-950" },
  identity: { text: "Signal Source", cls: "bg-violet-500/20 text-violet-200 border border-violet-500/40" },
};

function EntityNodeView({ data }: NodeProps<EntityNode>) {
  const style = KIND_STYLE[data.kind];
  const Icon = data.kind === "Account" ? (data.platform === "Discord" ? DiscordIcon : GitHubIcon) : style.icon;
  const tag = data.role ? ROLE_TAG[data.role] : undefined;

  return (
    <div
      className={cn("tg-node-enter group relative w-[176px]", data.dimmed && "opacity-45")}
      style={{ animationDelay: `${data.delay}ms` }}
    >
      <Handle type="target" position={Position.Top} />
      {tag && (
        <div
          className={cn(
            "absolute -top-2.5 left-3 z-10 rounded px-1.5 py-px font-mono text-[8.5px] font-semibold uppercase tracking-wider",
            tag.cls,
          )}
        >
          {tag.text}
        </div>
      )}
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/95 px-2.5 py-2 transition-all duration-200",
          "group-hover:-translate-y-px group-hover:border-zinc-600 group-hover:bg-zinc-900",
          data.role && ROLE_RING[data.role],
        )}
      >
        <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-md border", style.tone)}>
          <Icon className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[12px] font-medium leading-tight text-zinc-100">
              {data.kind === "Account" ? `@${data.label}` : data.label}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            <span className="font-mono text-[8.5px] uppercase tracking-wider text-zinc-500">
              {data.kind === "Account" ? data.platform : style.badge}
            </span>
            {data.subtitle && data.kind !== "Account" && (
              <span className="truncate text-[10px] text-zinc-400">· {data.subtitle}</span>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export const GraphEntityNode = memo(EntityNodeView);
