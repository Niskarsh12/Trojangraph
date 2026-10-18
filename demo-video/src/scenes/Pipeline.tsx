import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, fadeUp } from "../components";
import { C, clamp, ease, mono, sans } from "../theme";

const STEPS = [
  { n: "01", title: "Ingest friction", code: "GitHub issue · Discord #help", tone: C.muted },
  { n: "02", title: "Resolve identity", code: "(:Account)-[:IDENTIFIED_AS]->(:Developer)", tone: C.violetSoft },
  { n: "03", title: "Find the buyer", code: "(:Executive)-[:MANAGES]->(dev)-[:EMPLOYED_BY]->(:Company)", tone: "#fde68a" },
  { n: "04", title: "Route warm intro", code: "shortestPath((you)-[*1..4]->(vp))", tone: C.emeraldSoft },
  { n: "05", title: "Draft briefing", code: "LLM grounded in graph facts only", tone: C.muted },
];

const START = 40;
const GAP = 30;

const PipelineInner = () => {
  const frame = useCurrentFrame();
  const lineP = interpolate(frame, [START, START + GAP * 4], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ fontFamily: sans }}>
      <Backdrop />
      <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.035em", color: C.text, ...fadeUp(frame, 4, 30) }}>
          One click. Five graph-native steps.
        </div>
        <div style={{ marginTop: 20, fontSize: 36, color: C.muted, ...fadeUp(frame, 16) }}>
          Every answer comes from a deterministic FalkorDB traversal.
        </div>
      </div>

      <div style={{ position: "absolute", left: 110, right: 110, top: 520, height: 4, backgroundColor: "#27272a", borderRadius: 4 }}>
        <div
          style={{
            width: `${lineP * 100}%`,
            height: "100%",
            borderRadius: 4,
            backgroundColor: C.emerald,
            boxShadow: `0 0 18px ${C.emerald}`,
          }}
        />
      </div>

      <div style={{ position: "absolute", left: 90, right: 90, top: 470, display: "flex", justifyContent: "space-between" }}>
        {STEPS.map((s, i) => {
          const at = START + i * GAP;
          const p = interpolate(frame, [at, at + 16], [0, 1], { ...clamp, easing: ease });
          const lit = frame >= at;
          return (
            <div key={s.n} style={{ width: 320, display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.25 + p * 0.75 }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: lit ? "#052e22" : "#18181b",
                  border: `2px solid ${lit ? C.emerald : "#3f3f46"}`,
                  boxShadow: lit ? `0 0 ${30 * p}px ${C.emerald}88` : "none",
                  fontFamily: mono,
                  fontSize: 34,
                  fontWeight: 600,
                  color: lit ? C.emeraldSoft : C.dim,
                  scale: `${0.85 + p * 0.15}`,
                }}
              >
                {s.n}
              </div>
              <div style={{ marginTop: 34, fontSize: 40, fontWeight: 600, color: C.text, letterSpacing: "-0.02em", textAlign: "center" }}>
                {s.title}
              </div>
              <div
                style={{
                  marginTop: 18,
                  minHeight: 120,
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1.5px solid rgba(63,63,70,0.7)",
                  backgroundColor: "rgba(9,9,11,0.7)",
                  fontFamily: mono,
                  fontSize: 22,
                  lineHeight: 1.45,
                  color: s.tone,
                  textAlign: "center",
                  translate: `0 ${(1 - p) * 20}px`,
                }}
              >
                {s.code}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Pipeline = Interactive.create({ Component: PipelineInner, layout: "absolute-fill" });
