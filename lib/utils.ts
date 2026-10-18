import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMs(ms: number | undefined, digits = 2): string {
  if (ms === undefined || Number.isNaN(ms)) return "—";
  return ms < 1 ? `${ms.toFixed(digits)}ms` : ms < 100 ? `${ms.toFixed(1)}ms` : `${Math.round(ms)}ms`;
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
