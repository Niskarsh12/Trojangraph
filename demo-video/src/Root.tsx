import { Composition, Folder } from "remotion";
import { Intro } from "./scenes/Intro";
import { LiveDemo } from "./scenes/LiveDemo";
import { Outro } from "./scenes/Outro";
import { Pipeline } from "./scenes/Pipeline";
import { Problem } from "./scenes/Problem";
import { StripeDemo } from "./scenes/StripeDemo";
import { WhyGraph } from "./scenes/WhyGraph";
import { TrojanGraphDemo } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="TrojanGraphDemo" component={TrojanGraphDemo} durationInFrames={2275} fps={30} width={1920} height={1080} />
      <Folder name="Scenes">
        <Composition id="Intro" component={Intro} durationInFrames={180} fps={30} width={1920} height={1080} />
        <Composition id="Problem" component={Problem} durationInFrames={195} fps={30} width={1920} height={1080} />
        <Composition id="Pipeline" component={Pipeline} durationInFrames={240} fps={30} width={1920} height={1080} />
        <Composition id="LiveDemo" component={LiveDemo} durationInFrames={990} fps={30} width={1920} height={1080} />
        <Composition id="StripeDemo" component={StripeDemo} durationInFrames={310} fps={30} width={1920} height={1080} />
        <Composition id="WhyGraph" component={WhyGraph} durationInFrames={270} fps={30} width={1920} height={1080} />
        <Composition id="Outro" component={Outro} durationInFrames={180} fps={30} width={1920} height={1080} />
      </Folder>
    </>
  );
};
