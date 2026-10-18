import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { Callout, cameraStyle, Chip, Comet, FULL, Highlight, Shots, type Pt, type ScanLog } from "../components";
import layout from "../data/layout.json";
import scan from "../data/stripe-scan.json";
import { C, clamp } from "../theme";

const S = layout.stripe;
const spMs = (scan.logs as ScanLog[]).find((l) => l.step.startsWith("shortestPath"))?.serverMs ?? 0;

const StripeDemoInner = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <div
        style={cameraStyle(frame, [
          { at: 0, dur: 0, rect: FULL },
          { at: 18, dur: 42, rect: { x: 560, y: 215, w: 820, h: 620 } },
          { at: 196, dur: 40, rect: { x: 1100, y: 330, w: 820, h: 462 } },
        ])}
      >
        <Shots cuts={[{ src: "s4-stripe-result", at: 0 }]} />
        <Comet points={S.pathPoints as Pt[]} at={62} dur={96} />
        <Highlight rect={S.nodes["Maya Lindqvist"]} at={150} until={196} tone="amber" pad={5} radius={10} />
        <Highlight rect={S.path} at={226} tone="emerald" pad={4} radius={14} />
      </div>

      <div
        style={{
          position: "absolute",
          right: 40,
          top: 26,
          opacity: interpolate(frame, [30, 48], [0, 1], clamp),
        }}
      >
        <Chip tone="emerald" dot solid size={20}>
          Scenario 03 · Stripe · PR #88
        </Chip>
      </div>
      <Callout x={70} y={118} at={70} until={196} title="Multi-hop: 3 hops, still one query" sub="You → Marcus Webb → Tom Becker → Maya Lindqvist" />
      <Callout
        x={1850}
        y={118}
        align="right"
        at={128}
        until={196}
        tone="violet"
        title="Longer decoy routes rejected"
        sub={`shortestPath over every route ≤ 4 hops · ${spMs.toFixed(2)}ms`}
      />
      <Callout x={70} y={830} at={236} title="Intro routed through Tom Becker" sub="Ex-colleagues at Stripe → overlapped with Maya at Square" />
    </AbsoluteFill>
  );
};

export const StripeDemo = Interactive.create({ Component: StripeDemoInner, layout: "absolute-fill" });
