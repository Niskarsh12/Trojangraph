import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { Easing } from "remotion";

export const { fontFamily: sans } = loadGeist("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
export const { fontFamily: mono } = loadGeistMono("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const C = {
  bg: "#09090b",
  surface: "rgba(24,24,27,0.78)",
  border: "rgba(63,63,70,0.7)",
  text: "#f4f4f5",
  muted: "#a1a1aa",
  dim: "#71717a",
  emerald: "#10b981",
  emeraldSoft: "#6ee7b7",
  violet: "#8b5cf6",
  violetSoft: "#c4b5fd",
  amber: "#fbbf24",
  sky: "#7dd3fc",
};

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
