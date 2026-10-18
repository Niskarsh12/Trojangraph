import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Intro } from "./scenes/Intro";
import { LiveDemo } from "./scenes/LiveDemo";
import { Outro } from "./scenes/Outro";
import { Pipeline } from "./scenes/Pipeline";
import { Problem } from "./scenes/Problem";
import { StripeDemo } from "./scenes/StripeDemo";
import { WhyGraph } from "./scenes/WhyGraph";

// 180 + 195 + 240 + 990 + 310 + 270 + 180 - 6 * 15 = 2275 frames (75.8s @ 30fps)
export const TrojanGraphDemo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence name="Intro" durationInFrames={180}>
      <Intro />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Problem" durationInFrames={195}>
      <Problem />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Pipeline" durationInFrames={240}>
      <Pipeline />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Live demo · Plaid" durationInFrames={990}>
      <LiveDemo />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Live demo · Stripe" durationInFrames={310}>
      <StripeDemo />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Why graph" durationInFrames={270}>
      <WhyGraph />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Outro" durationInFrames={180}>
      <Outro />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
