import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, fadeUp, type ScanLog } from "../components";
import scan from "../data/plaid-scan.json";
import { C, clamp, ease, mono, sans } from "../theme";

const logs = scan.logs as ScanLog[];
const queries = logs.filter((l) => l.serverMs !== undefined).length;
const totalMs = scan.result.timings.totalServerMs;
const spMs = logs.find((l) => l.step.startsWith("shortestPath"))?.serverMs ?? 0;

const FLAT = [
  "Recursive CTEs + JOINs across 6 tables per lead",
  "Embeddings can't follow MANAGES → BACKED_BY chains",
  "No native shortest path across investor networks",
];

const Stat: React.FC<{ value: number; decimals: number; suffix?: string; label: string; at: number }> = ({ value, decimals, suffix = "", label, at }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 30], [0, 1], { ...clamp, easing: ease });
  return (
    <div style={{ opacity: interpolate(frame, [at, at + 10], [0, 1], clamp) }}>
      <div style={{ fontSize: 92, fontWeight: 700, color: C.emeraldSoft, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
        {(value * p).toFixed(decimals)}
        <span style={{ fontSize: 50, color: C.emerald }}>{suffix}</span>
      </div>
      <div style={{ marginTop: 2, fontFamily: mono, fontSize: 24, color: C.muted }}>{label}</div>
    </div>
  );
};

const WhyGraphInner = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: sans }}>
      <Backdrop />
      <div style={{ position: "absolute", top: 110, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.035em", color: C.text, ...fadeUp(frame, 2, 30) }}>
          The graph is load-bearing.
        </div>
        <div style={{ marginTop: 18, fontSize: 38, color: C.muted, ...fadeUp(frame, 14) }}>
          Identity, hierarchy and routing are all multi-hop traversals.
        </div>
      </div>

      <div style={{ position: "absolute", left: 130, top: 400, width: 760, ...fadeUp(frame, 26, 30) }}>
        <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: "0.12em", color: C.dim }}>FLAT SQL / VECTOR DB</div>
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 30 }}>
          {FLAT.map((t, i) => (
            <div key={t} style={{ display: "flex", gap: 22, alignItems: "flex-start", ...fadeUp(frame, 40 + i * 14, 16) }}>
              <span style={{ color: "#f87171", fontSize: 40, lineHeight: 1, fontWeight: 600 }}>✕</span>
              <span style={{ fontSize: 40, color: "#d4d4d8", lineHeight: 1.25 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 130,
          top: 380,
          width: 820,
          padding: "40px 50px",
          borderRadius: 28,
          border: `2px solid ${C.emerald}55`,
          backgroundColor: "rgba(6,40,30,0.45)",
          boxShadow: `0 0 80px ${C.emerald}22`,
          ...fadeUp(frame, 60, 30),
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 26, letterSpacing: "0.12em", color: C.emeraldSoft }}>FALKORDB · MEASURED LIVE</div>
        <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 34, columnGap: 40 }}>
          <Stat value={queries} decimals={0} label="Cypher traversals" at={76} />
          <Stat value={totalMs} decimals={2} suffix="ms" label="total graph engine time" at={88} />
          <Stat value={spMs} decimals={2} suffix="ms" label="shortestPath routing" at={100} />
          <div style={{ ...fadeUp(frame, 112, 14), display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div style={{ fontSize: 66, fontWeight: 700, color: C.emeraldSoft, letterSpacing: "-0.035em", lineHeight: 1.25 }}>
              GraphBLAS
            </div>
            <div style={{ marginTop: 2, fontFamily: mono, fontSize: 24, color: C.muted }}>sparse-matrix engine</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const WhyGraph = Interactive.create({ Component: WhyGraphInner, layout: "absolute-fill" });
