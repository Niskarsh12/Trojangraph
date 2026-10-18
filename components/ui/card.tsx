import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-zinc-800/80 bg-zinc-900/70 backdrop-blur-md", className)}
      {...props}
    />
  );
}

export function SectionLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500", className)}
      {...props}
    />
  );
}
