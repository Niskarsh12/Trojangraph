import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider font-mono [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-zinc-800 bg-zinc-900 text-zinc-400",
        emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
        amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        red: "border-red-500/30 bg-red-500/10 text-red-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
