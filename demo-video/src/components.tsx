import type React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, clamp, ease, easeInOut, mono, sans } from "./theme";

export type Rect = { x: number; y: number; w: number; h: number };
export type Pt = [number, number];

export const SCREEN = { w: 1920, h: 1080 };
export const FULL: Rect = { x: 0, y: 0, w: 1920, h: 1080 };

/* ---------------------------------- Backdrop --------------------------------- */

export const Backdrop: React.FC<{ glow?: string }> = ({ glow = C.emerald }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(#27272a 1.3px, transparent 1.3px)",
          backgroundSize: "34px 34px",
          backgroundPosition: `${(frame * 0.25) % 34}px ${(frame * 0.15) % 34}px`,
          opacity: 0.75,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          left: 310 + Math.sin(frame / 90) * 60,
          top: -520 + Math.cos(frame / 110) * 40,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glow}2e 0%, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          right: -380 + Math.cos(frame / 120) * 50,
          bottom: -560,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.violet}24 0%, transparent 62%)`,
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};

/* ------------------------------------ Chip ----------------------------------- */

export const Chip: React.FC<{
  children: React.ReactNode;
  tone?: "emerald" | "violet" | "zinc" | "amber";
  size?: number;
  dot?: boolean;
  solid?: boolean;
  style?: React.CSSProperties;
}> = ({ children, tone = "zinc", size = 22, dot, solid, style }) => {
  const color = tone === "emerald" ? C.emerald : tone === "violet" ? C.violet : tone === "amber" ? C.amber : "#52525b";
  const text = tone === "emerald" ? C.emeraldSoft : tone === "violet" ? C.violetSoft : tone === "amber" ? "#fde68a" : C.muted;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.5,
        padding: `${size * 0.35}px ${size * 0.7}px`,
        borderRadius: size * 0.45,
        border: `1.5px solid ${color}66`,
        backgroundColor: solid ? "rgba(9,9,11,0.94)" : `${color}1a`,
        boxShadow: solid ? `0 8px 30px rgba(0,0,0,0.5), inset 0 0 0 100px ${color}14` : undefined,
        color: text,
        fontFamily: mono,
        fontSize: size,
        fontWeight: 500,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: size * 0.42,
            height: size * 0.42,
            borderRadius: 99,
            backgroundColor: color,
            boxShadow: `0 0 ${size * 0.6}px ${color}`,
          }}
        />
      )}
      {children}
    </div>
  );
};

/* ---------------------------------- Camera ----------------------------------- */

export type CamKey = { at: number; dur: number; rect: Rect; pad?: number };

const zoomFor = (r: Rect, pad = 0.94) => Math.min(SCREEN.w / r.w, SCREEN.h / r.h) * pad;

/** Eased camera that frames successive rectangles of the 1920x1080 screen space. */
export function cameraStyle(frame: number, keys: CamKey[]): React.CSSProperties {
  let prev = keys[0];
  let cur = keys[0];
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].at <= frame) {
      cur = keys[i];
      prev = keys[Math.max(0, i - 1)];
    }
  }
  const t = cur.dur <= 0 ? 1 : interpolate(frame, [cur.at, cur.at + cur.dur], [0, 1], { ...clamp, easing: easeInOut });
  const z0 = prev === cur ? zoomFor(cur.rect, cur.pad ?? (cur.rect.w === SCREEN.w ? 1 : 0.94)) : zoomFor(prev.rect, prev.pad ?? (prev.rect.w === SCREEN.w ? 1 : 0.94));
  const z1 = zoomFor(cur.rect, cur.pad ?? (cur.rect.w === SCREEN.w ? 1 : 0.94));
  const z = Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * t);
  const c0 = [prev.rect.x + prev.rect.w / 2, prev.rect.y + prev.rect.h / 2];
  const c1 = [cur.rect.x + cur.rect.w / 2, cur.rect.y + cur.rect.h / 2];
  let cx = c0[0] + (c1[0] - c0[0]) * t;
  let cy = c0[1] + (c1[1] - c0[1]) * t;
  // Never show beyond the screenshot edges.
  const halfW = SCREEN.w / 2 / z;
  const halfH = SCREEN.h / 2 / z;
  cx = Math.min(Math.max(cx, halfW), SCREEN.w - halfW);
  cy = Math.min(Math.max(cy, halfH), SCREEN.h - halfH);
  return {
    position: "absolute",
    left: 0,
    top: 0,
    width: SCREEN.w,
    height: SCREEN.h,
    transformOrigin: "0 0",
    translate: `${SCREEN.w / 2 - cx * z}px ${SCREEN.h / 2 - cy * z}px`,
    scale: `${z}`,
  };
}

/* ------------------------------- Screenshot stack ------------------------------ */

export type ShotCut = { src: string; at: number; fade?: number };

/** Stacked screenshots that crossfade at their `at` frame. */
export const Shots: React.FC<{ cuts: ShotCut[] }> = ({ cuts }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {cuts.map((c, i) => {
        const opacity = i === 0 ? 1 : interpolate(frame, [c.at, c.at + (c.fade ?? 10)], [0, 1], clamp);
        if (opacity <= 0) return null;
        return (
          <Img
            key={c.src}
            src={staticFile(`shots/${c.src}.png`)}
            style={{ position: "absolute", left: 0, top: 0, width: SCREEN.w, height: SCREEN.h, opacity }}
          />
        );
      })}
    </>
  );
};

/* ---------------------------------- Cursor ----------------------------------- */

export type Waypoint = { f: number; x: number; y: number };

export const Cursor: React.FC<{ path: Waypoint[]; clicks?: number[]; show?: [number, number] }> = ({
  path,
  clicks = [],
  show = [0, 99999],
}) => {
  const frame = useCurrentFrame();
  let x = path[0].x;
  let y = path[0].y;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (frame >= a.f) {
      const t = interpolate(frame, [a.f, b.f], [0, 1], { ...clamp, easing: easeInOut });
      x = a.x + (b.x - a.x) * t;
      y = a.y + (b.y - a.y) * t;
    }
  }
  const opacity = interpolate(frame, [show[0], show[0] + 8, show[1] - 8, show[1]], [0, 1, 1, 0], clamp);
  const pressed = clicks.some((c) => frame >= c && frame < c + 5);
  return (
    <>
      {clicks.map((c) => {
        const p = interpolate(frame, [c, c + 20], [0, 1], clamp);
        if (frame < c || p >= 1) return null;
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: x - 9,
              top: y - 9,
              width: 18,
              height: 18,
              borderRadius: 99,
              border: `2.5px solid ${C.emerald}`,
              boxShadow: `0 0 18px ${C.emerald}`,
              opacity: 1 - p,
              scale: `${0.6 + p * 3.4}`,
            }}
          />
        );
      })}
      <svg
        width={30}
        height={30}
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: x - 4,
          top: y - 3,
          opacity,
          scale: pressed ? "0.82" : "1",
          filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.7))",
        }}
      >
        <path
          d="M4 2.5l15.5 9.2-6.9 1.5 3.9 7.3-2.9 1.5-3.9-7.4L4.6 19z"
          fill="#fafafa"
          stroke="#09090b"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
};

/* ---------------------------------- Callout ---------------------------------- */

export const Callout: React.FC<{
  x: number;
  y: number;
  at: number;
  until?: number;
  title: string;
  sub?: string;
  tone?: "emerald" | "violet" | "amber";
  align?: "left" | "right";
  scale?: number;
}> = ({ x, y, at, until = 99999, title, sub, tone = "emerald", align = "left", scale = 1 }) => {
  const frame = useCurrentFrame();
  const color = tone === "emerald" ? C.emerald : tone === "violet" ? C.violet : C.amber;
  const inP = interpolate(frame, [at, at + 14], [0, 1], { ...clamp, easing: ease });
  const outP = interpolate(frame, [until - 10, until], [1, 0], clamp);
  const o = Math.min(inP, outP);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: align === "left" ? x : undefined,
        right: align === "right" ? SCREEN.w - x : undefined,
        top: y,
        opacity: o,
        translate: `0 ${(1 - inP) * 14}px`,
        scale: `${scale}`,
        transformOrigin: align === "left" ? "left top" : "right top",
        padding: "14px 20px",
        borderRadius: 14,
        backgroundColor: "rgba(9,9,11,0.92)",
        border: `1.5px solid ${color}88`,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.55), 0 0 30px ${color}33`,
        fontFamily: sans,
        maxWidth: 520,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 9, height: 9, borderRadius: 99, backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
        <span style={{ color: C.text, fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" }}>{title}</span>
      </div>
      {sub && <div style={{ marginTop: 6, color: C.muted, fontSize: 18, fontFamily: mono, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
};

/* -------------------------------- Highlight ring ------------------------------- */

export const Highlight: React.FC<{ rect: Rect; at: number; until?: number; tone?: "emerald" | "violet" | "amber"; pad?: number; radius?: number }> = ({
  rect,
  at,
  until = 99999,
  tone = "emerald",
  pad = 6,
  radius = 14,
}) => {
  const frame = useCurrentFrame();
  const color = tone === "emerald" ? C.emerald : tone === "violet" ? C.violet : C.amber;
  const draw = interpolate(frame, [at, at + 18], [0, 1], { ...clamp, easing: ease });
  const out = interpolate(frame, [until - 10, until], [1, 0], clamp);
  if (frame < at || out <= 0) return null;
  const w = rect.w + pad * 2;
  const h = rect.h + pad * 2;
  const perim = 2 * (w + h);
  return (
    <svg
      style={{ position: "absolute", left: rect.x - pad, top: rect.y - pad, overflow: "visible", opacity: out }}
      width={w}
      height={h}
    >
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        rx={radius}
        fill={`${color}0d`}
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={perim}
        strokeDashoffset={perim * (1 - draw)}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  );
};

/* ----------------------------------- Comet ----------------------------------- */

/** A glowing tracer that travels along the real React Flow edge geometry. */
export const Comet: React.FC<{ points: Pt[]; at: number; dur: number }> = ({ points, at, dur }) => {
  const frame = useCurrentFrame();
  if (points.length < 2 || frame < at) return null;
  const segs: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    segs.push(segs[i - 1] + Math.hypot(bx - ax, by - ay));
  }
  const total = segs[segs.length - 1];
  const p = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: easeInOut });
  const len = total * p;
  let i = segs.findIndex((s) => s >= len);
  if (i <= 0) i = 1;
  const local = (len - segs[i - 1]) / Math.max(0.001, segs[i] - segs[i - 1]);
  const hx = points[i - 1][0] + (points[i][0] - points[i - 1][0]) * local;
  const hy = points[i - 1][1] + (points[i][1] - points[i - 1][1]) * local;
  const d = points.map(([x, y], k) => `${k ? "L" : "M"}${x},${y}`).join(" ");
  const pulse = 1 + Math.sin(frame / 4) * 0.15;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={SCREEN.w} height={SCREEN.h}>
      <path
        d={d}
        fill="none"
        stroke={C.emerald}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={total}
        strokeDashoffset={total - len}
        style={{ filter: `drop-shadow(0 0 6px ${C.emerald}) drop-shadow(0 0 16px ${C.emerald})` }}
      />
      <circle cx={hx} cy={hy} r={9 * pulse} fill="#d1fae5" style={{ filter: `drop-shadow(0 0 10px ${C.emerald}) drop-shadow(0 0 22px ${C.emerald})` }} />
    </svg>
  );
};

/* ------------------------------ Terminal overlay ------------------------------- */

export type ScanLog = { step: string; cypher: string; serverMs?: number; roundTripMs?: number; rows?: number; status: string };

const KW = /\b(MATCH|OPTIONAL|WHERE|RETURN|WITH|ORDER BY|LIMIT|AS|AND|CASE|WHEN|THEN|ELSE|END|IS NOT NULL|CONTAINS|DESC|IN)\b/g;

const CypherLine: React.FC<{ text: string }> = ({ text }) => {
  if (text.trimStart().startsWith("//")) return <span style={{ color: C.emerald }}>{text}</span>;
  const parts: React.ReactNode[] = [];
  let last = 0;
  const re = new RegExp(`${KW.source}|(\\$\\w+)|(:[A-Z][A-Za-z_|]*)|(shortestPath|toLower|coalesce|collect|size|nodes|length)(?=\\()`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const color = m[1] ? "#a78bfa" : m[2] ? "#fcd34d" : m[3] ? C.sky : C.emeraldSoft;
    parts.push(
      <span key={m.index} style={{ color }}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
};

/** Native re-render of the app's Cypher terminal, streaming the real logs from the live scan. */
export const TerminalStream: React.FC<{ logs: ScanLog[]; rect: Rect; at: number; every: number; until: number }> = ({
  logs,
  rect,
  at,
  every,
  until,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 8, until - 12, until], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  const shown = logs.filter((_, i) => frame >= at + 10 + i * every);
  const totalServer = shown.reduce((s, l) => s + (l.serverMs ?? 0), 0);
  const queries = shown.filter((l) => l.serverMs !== undefined).length;
  const running = shown.length < logs.length;
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        opacity: o,
        borderRadius: 12,
        border: "1px solid rgba(63,63,70,0.8)",
        backgroundColor: "#050506",
        overflow: "hidden",
        fontFamily: mono,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: "1px solid rgba(63,63,70,0.8)",
          fontSize: 10,
          letterSpacing: "0.14em",
          color: C.muted,
        }}
      >
        <span>CYPHER EXECUTION LOG</span>
        <span style={{ letterSpacing: 0 }}>
          {queries} queries <span style={{ color: C.emerald }}>Σ {totalServer.toFixed(2)}ms</span>
        </span>
      </div>
      <div style={{ padding: 12, display: "flex", flexDirection: "column", justifyContent: "flex-end", flex: 1, gap: 9, overflow: "hidden" }}>
        {shown.map((l, i) => {
          const appear = interpolate(frame, [at + 10 + i * every, at + 16 + i * every], [0, 1], clamp);
          const lines = l.cypher.split("\n").slice(0, l.status === "info" ? 1 : 3);
          return (
            <div key={i} style={{ opacity: appear, translate: `${(1 - appear) * -6}px 0`, fontSize: 10.5, lineHeight: 1.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: l.status === "info" ? C.muted : C.text }}>▸ {l.step}</span>
                {l.serverMs !== undefined && (
                  <span style={{ color: C.emerald, whiteSpace: "nowrap" }}>
                    {l.serverMs.toFixed(2)}ms
                    <span style={{ color: C.dim }}> · {l.rows}r</span>
                  </span>
                )}
              </div>
              <div style={{ borderLeft: "1px solid #27272a", paddingLeft: 9, marginTop: 2, color: C.muted, whiteSpace: "pre", overflow: "hidden" }}>
                {lines.map((ln, k) => (
                  <div key={k}>
                    <CypherLine text={ln} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {running && (
          <div style={{ color: C.violetSoft, fontSize: 10.5 }}>
            ● agent traversing graph<span style={{ opacity: Math.floor(frame / 8) % 2 ? 0 : 1 }}>▌</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------- Text helpers -------------------------------- */

export function fadeUp(frame: number, at: number, dist = 26): React.CSSProperties {
  const p = interpolate(frame, [at, at + 18], [0, 1], { ...clamp, easing: ease });
  return { opacity: p, translate: `0 ${(1 - p) * dist}px` };
}
