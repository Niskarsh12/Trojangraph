import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, fadeUp } from "../components";
import { C, clamp, ease, mono, sans } from "../theme";

const Handle: React.FC<{ platform: "GitHub" | "Discord"; handle: string; text: string; at: number }> = ({ platform, handle, text, at }) => {
  const frame = useCurrentFrame();
  const color = platform === "GitHub" ? "#e4e4e7" : "#a5b4fc";
  return (
    <div
      style={{
        width: 720,
        padding: "26px 30px",
        borderRadius: 20,
        border: "1.5px solid rgba(63,63,70,0.8)",
        backgroundColor: "rgba(24,24,27,0.8)",
        ...fadeUp(frame, at, 30),
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontFamily: mono, fontSize: 20, color: C.dim, letterSpacing: "0.1em" }}>{platform.toUpperCase()}</span>
        <span style={{ fontFamily: mono, fontSize: 28, color }}>@{handle}</span>
      </div>
      <div style={{ marginTop: 12, fontSize: 32, color: C.text, lineHeight: 1.35 }}>{text}</div>
    </div>
  );
};

const QUESTIONS = ["Who is this developer, really?", "Who holds the budget?", "Who can introduce you?"];

const ProblemInner = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: sans }}>
      <Backdrop glow={C.violet} />
      <div style={{ position: "absolute", left: 130, top: 120, width: 1660 }}>
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.035em", color: C.text, lineHeight: 1.08, ...fadeUp(frame, 4, 34) }}>
          Your next enterprise deal is
          <br />
          already in your <span style={{ color: C.emeraldSoft }}>Discord</span>.
        </div>
      </div>

      <div style={{ position: "absolute", left: 130, top: 470, display: "flex", flexDirection: "column", gap: 28 }}>
        <Handle platform="GitHub" handle="dev_dan_99" text="Issue #402: Distributed memory sync timeout on 50 nodes" at={34} />
        <Handle platform="Discord" handle="dan_in_the_cloud" text="#help: replicas keep timing out during failover…" at={50} />
      </div>

      <div style={{ position: "absolute", left: 1000, top: 500, display: "flex", flexDirection: "column", gap: 34 }}>
        {QUESTIONS.map((q, i) => {
          const at = 84 + i * 18;
          const p = interpolate(frame, [at, at + 16], [0, 1], { ...clamp, easing: ease });
          return (
            <div key={q} style={{ display: "flex", alignItems: "center", gap: 24, opacity: p, translate: `${(1 - p) * 40}px 0` }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  border: `1.5px solid ${C.violet}77`,
                  backgroundColor: `${C.violet}1f`,
                  color: C.violetSoft,
                  fontSize: 38,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ?
              </div>
              <span style={{ fontSize: 46, color: C.text, fontWeight: 500, letterSpacing: "-0.015em" }}>{q}</span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 130,
          bottom: 90,
          fontFamily: mono,
          fontSize: 28,
          color: C.muted,
          ...fadeUp(frame, 148, 16),
        }}
      >
        Keyword search can&apos;t answer these. <span style={{ color: C.emeraldSoft }}>Graph traversal can.</span>
      </div>
    </AbsoluteFill>
  );
};

export const Problem = Interactive.create({ Component: ProblemInner, layout: "absolute-fill" });
