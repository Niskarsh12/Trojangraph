import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Backdrop, Chip, fadeUp } from "../components";
import { C, clamp, ease, sans } from "../theme";

const NODES: [number, number][] = [
  [260, 220], [520, 140], [430, 420], [180, 640], [470, 860],
  [1660, 200], [1420, 120], [1500, 420], [1740, 640], [1450, 880],
];
const EDGES: [number, number][] = [[0, 1], [1, 2], [0, 2], [2, 3], [3, 4], [5, 6], [6, 7], [5, 7], [7, 8], [8, 9], [2, 7]];

export const Logo: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.24,
      border: `2px solid ${C.emerald}66`,
      backgroundColor: `${C.emerald}1f`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 0 ${size * 0.6}px ${C.emerald}40`,
    }}
  >
    <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke={C.emerald} strokeWidth={1.8}>
      <circle cx="5" cy="5" r="2.2" />
      <circle cx="19" cy="7" r="2.2" />
      <circle cx="12" cy="19" r="2.2" />
      <path d="M7 5.6 16.9 6.6M6.1 7 11 17M17.9 9 13 17" strokeLinecap="round" />
    </svg>
  </div>
);

const IntroInner = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: sans }}>
      <Backdrop />
      <svg width={1920} height={1080} style={{ position: "absolute", opacity: 0.55 }}>
        {EDGES.map(([a, b], i) => {
          const p = interpolate(frame, [8 + i * 4, 34 + i * 4], [0, 1], { ...clamp, easing: ease });
          const [ax, ay] = NODES[a];
          const [bx, by] = NODES[b];
          const hot = i === 10;
          return (
            <line
              key={i}
              x1={ax}
              y1={ay}
              x2={ax + (bx - ax) * p}
              y2={ay + (by - ay) * p}
              stroke={hot ? C.emerald : "#3f3f46"}
              strokeWidth={hot ? 2.5 : 1.5}
              style={hot ? { filter: `drop-shadow(0 0 8px ${C.emerald})` } : undefined}
            />
          );
        })}
        {NODES.map(([x, y], i) => {
          const s = interpolate(frame, [i * 3, i * 3 + 16], [0, 1], { ...clamp, easing: ease });
          return <circle key={i} cx={x} cy={y} r={7 * s} fill={i === 2 || i === 7 ? C.emerald : "#52525b"} />;
        })}
      </svg>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div
          style={{
            scale: `${interpolate(frame, [10, 34], [0.6, 1], { ...clamp, easing: ease })}`,
            opacity: interpolate(frame, [10, 26], [0, 1], clamp),
          }}
        >
          <Logo size={120} />
        </div>
        <Interactive.Div
          name="Title"
          style={{
            marginTop: 36,
            fontSize: 150,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            color: C.text,
            ...fadeUp(frame, 22, 40),
          }}
        >
          TrojanGraph
        </Interactive.Div>
        <div style={{ marginTop: 10, fontSize: 46, color: C.muted, fontWeight: 400, letterSpacing: "-0.01em", ...fadeUp(frame, 36) }}>
          Revenue intelligence that <span style={{ color: C.emeraldSoft }}>walks the graph</span>.
        </div>
        <div style={{ marginTop: 64, display: "flex", gap: 20, ...fadeUp(frame, 54) }}>
          <Chip tone="emerald" dot size={24}>
            FalkorDB Cloud
          </Chip>
          <Chip size={24}>Track 01 · Agents That Act on Connected Data</Chip>
          <Chip tone="violet" size={24}>
            Graph Hacks
          </Chip>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Intro = Interactive.create({ Component: IntroInner, layout: "absolute-fill" });
