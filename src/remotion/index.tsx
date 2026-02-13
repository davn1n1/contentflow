import { registerRoot } from "remotion";
import { Composition } from "remotion";
import React from "react";
import { DynamicVideo } from "../lib/remotion/compositions/DynamicVideo";

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
        }}
      />
    </>
  );
};

registerRoot(Root);
