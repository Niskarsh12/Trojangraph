import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Chip, fadeUp } from "../components";
import { C, clamp, ease, mono, sans } from "../theme";
import { Logo } from "./Intro";

const OutroInner = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: sans }}>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ opacity: interpolate(frame, [0, 14], [0, 1], clamp), scale: `${interpolate(frame, [0, 22], [0.7, 1], { ...clamp, easing: ease })}` }}>
          <Logo size={110} />
        </div>
        <div style={{ marginTop: 34, fontSize: 120, fontWeight: 700, letterSpacing: "-0.045em", color: C.text, ...fadeUp(frame, 10, 34) }}>
          TrojanGraph
        </div>
        <div style={{ marginTop: 16, fontSize: 50, color: C.muted, letterSpacing: "-0.015em", ...fadeUp(frame, 24) }}>
          Find the buyer. <span style={{ color: C.text }}>Walk the graph.</span>{" "}
          <span style={{ color: C.emeraldSoft }}>Get the intro.</span>
        </div>
        <div style={{ marginTop: 70, display: "flex", gap: 18, ...fadeUp(frame, 44) }}>
          <Chip tone="emerald" dot size={24}>
            FalkorDB Cloud
          </Chip>
          <Chip size={24}>Next.js 15</Chip>
          <Chip size={24}>React Flow</Chip>
          <Chip tone="violet" size={24}>
            OpenAI
          </Chip>
        </div>
        <div style={{ marginTop: 56, fontFamily: mono, fontSize: 26, color: C.dim, ...fadeUp(frame, 60, 12) }}>
          Graph Hacks · Track 01 · Agents That Act on Connected Data
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Outro = Interactive.create({ Component: OutroInner, layout: "absolute-fill" });
