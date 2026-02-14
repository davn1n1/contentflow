import { registerRoot } from "remotion";
import { Composition } from "remotion";
import React from "react";
import { DynamicVideo } from "../lib/remotion/compositions/DynamicVideo";
import type { RemotionTimeline } from "../lib/remotion/types";

const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="DynamicVideo"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={DynamicVideo as React.FC<any>}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          fps: 30,
          width: 1920,
          height: 1080,
          durationInFrames: 900,
          backgroundColor: "#000000",
          tracks: [],
        } satisfies RemotionTimeline}
        calculateMetadata={({ props }) => {
          const p = props as unknown as RemotionTimeline;
          return {
            durationInFrames: p.durationInFrames || 900,
            fps: p.fps || 30,
            width: p.width || 1920,
            height: p.height || 1080,
          };
        }}
      />
    </>
  );
};

registerRoot(Root);
