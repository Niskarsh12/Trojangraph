import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import {
  Callout,
  cameraStyle,
  Chip,
  Comet,
  Cursor,
  FULL,
  Highlight,
  Shots,
  TerminalStream,
  type Pt,
  type Rect,
  type ScanLog,
} from "../components";
import layout from "../data/layout.json";
import scan from "../data/plaid-scan.json";
import { C, clamp, mono, sans } from "../theme";

const L = layout;
const P = layout.plaid;
const center = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const node = (name: keyof typeof P.nodes): Rect => P.nodes[name];

const logs = scan.logs as ScanLog[];
const spMs = logs.find((l) => l.step.startsWith("shortestPath"))?.serverMs ?? 0;

const plaidCard = center(L.plaidCard);
const exec = center(L.execute);
const copy = center(P.copy);

/** Replica of the app's in-flight scan UI over the static "selected" still. */
const InFlight: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 4, to - 8, to], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  const spin = (frame * 14) % 360;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: L.execute.x,
          top: L.execute.y,
          width: L.execute.w,
          height: L.execute.h,
          opacity: o,
          borderRadius: 6,
          backgroundColor: "#0c6b4e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "#022c22",
          fontFamily: sans,
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" style={{ rotate: `${spin}deg` }}>
          <path d="M21 12a9 9 0 1 1-6.2-8.6" fill="none" stroke="#022c22" strokeWidth={2.6} strokeLinecap="round" />
        </svg>
        Infiltrating graph…
      </div>
      <div
        style={{
          position: "absolute",
          left: 960 - 240,
          top: 590 - 110,
          width: 480,
          height: 220,
          opacity: o,
          background: "radial-gradient(ellipse at center, #09090b 55%, rgba(9,9,11,0) 72%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" style={{ rotate: `${spin}deg` }}>
          <path d="M21 12a9 9 0 1 1-6.2-8.6" fill="none" stroke={C.violet} strokeWidth={2.4} strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: mono, fontSize: 13, color: C.violetSoft }}>Traversing FalkorDB…</span>
      </div>
    </>
  );
};

const LiveDemoInner = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <div
        style={cameraStyle(frame, [
          { at: 0, dur: 0, rect: FULL },
          { at: 22, dur: 40, rect: { x: 0, y: 56, w: 900, h: 506 } },
          { at: 108, dur: 38, rect: { x: 0, y: 470, w: 1000, h: 610 } },
          { at: 298, dur: 44, rect: FULL },
          { at: 350, dur: 42, rect: { x: 560, y: 268, w: 820, h: 620 } },
          { at: 545, dur: 42, rect: { x: 1060, y: 90, w: 860, h: 484 } },
          { at: 650, dur: 36, rect: { x: 1100, y: 330, w: 820, h: 462 } },
          { at: 712, dur: 42, rect: { x: 1180, y: 506, w: 740, h: 560 } },
          { at: 905, dur: 48, rect: FULL },
        ])}
      >
        <Shots
          cuts={[
            { src: "s0-empty", at: 0 },
            { src: "s1-plaid-selected", at: 54, fade: 6 },
            { src: "s2-plaid-result", at: 298, fade: 14 },
            { src: "s3-plaid-email", at: 714, fade: 16 },
            { src: "s3b-plaid-copied", at: 856, fade: 6 },
          ]}
        />
        <InFlight from={104} to={306} />
        <TerminalStream logs={logs} rect={L.terminal} at={110} every={17} until={312} />

        <Comet points={P.pathPoints as Pt[]} at={396} dur={72} />
        <Highlight rect={node("@dev_dan_99")} at={470} until={540} tone="violet" pad={5} radius={10} />
        <Highlight rect={node("@dan_in_the_cloud")} at={476} until={540} tone="violet" pad={5} radius={10} />
        <Highlight rect={node("Dan Miller")} at={482} until={540} tone="violet" pad={5} radius={10} />

        <Highlight rect={P.champion} at={572} until={648} tone="violet" pad={4} radius={14} />
        <Highlight rect={P.buyer} at={592} until={648} tone="amber" pad={4} radius={14} />
        <Highlight rect={P.path} at={668} until={712} tone="emerald" pad={4} radius={14} />
        <Highlight rect={P.email} at={760} until={900} tone="emerald" pad={4} radius={14} />

        <Cursor
          path={[
            { f: 0, x: 1150, y: 760 },
            { f: 46, x: plaidCard.x + 40, y: plaidCard.y },
            { f: 70, x: plaidCard.x + 40, y: plaidCard.y },
            { f: 98, x: exec.x, y: exec.y },
          ]}
          clicks={[52, 103]}
          show={[0, 300]}
        />
        <Cursor
          path={[
            { f: 814, x: 1720, y: 860 },
            { f: 850, x: copy.x, y: copy.y },
          ]}
          clicks={[854]}
          show={[812, 990]}
        />
      </div>

      {/* Screen-space captions */}
      <div
        style={{
          position: "absolute",
          right: 40,
          top: 26,
          opacity: interpolate(
            frame,
            [36, 54, 292, 306, 356, 374, 900, 914],
            [0, 1, 1, 0, 0, 1, 1, 0],
            clamp,
          ),
        }}
      >
        <Chip tone="emerald" dot solid size={20}>
          LIVE · real queries on FalkorDB Cloud
        </Chip>
      </div>

      <Callout x={1240} y={760} at={60} until={104} title="Zero-typing scenario cards" sub="Scenario 01 · Plaid · GitHub Issue #402" />
      <Callout
        x={1130}
        y={850}
        at={150}
        until={296}
        tone="violet"
        title="Every Cypher query, streamed live"
        sub="Read-only GRAPH.RO_QUERY · engine time per traversal"
      />
      <Callout
        x={70}
        y={118}
        at={404}
        until={540}
        title="shortestPath found the warm intro"
        sub={`You → Alex Vance (Seed VC) → Sarah Chen · ${spMs.toFixed(2)}ms`}
      />
      <Callout
        x={1850}
        y={150}
        align="right"
        at={480}
        until={540}
        tone="violet"
        title="Identity resolved"
        sub="@dev_dan_99 + dan_in_the_cloud → Dan Miller"
      />
      <Callout x={70} y={830} at={580} until={646} tone="amber" title="Champion vs. Economic Buyer" sub="Dan feels the pain · Sarah Chen holds the $65K budget" />
      <Callout x={70} y={830} at={672} until={710} title="Two-hop path, explained" sub="Backed by Seed · ex-colleagues at Google (2019–2022)" />
      <Callout x={70} y={790} at={766} until={900} title="Briefing grounded in graph facts" sub="Cites Issue #402 + HA Distributed Clustering · no invented names" />
    </AbsoluteFill>
  );
};

export const LiveDemo = Interactive.create({ Component: LiveDemoInner, layout: "absolute-fill" });
