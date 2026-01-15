import { Composition } from "remotion";
import {
  CAPTIONED_VIDEO_COMP_NAME,
  defaultCaptionedVideoProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../types/constants";
import { CaptionedVideoMain } from "./CaptionedVideo/Main";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={CAPTIONED_VIDEO_COMP_NAME}
        component={CaptionedVideoMain}
        durationInFrames={DURATION_IN_FRAMES * 10} // Default to 60 seconds, will be overridden
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultCaptionedVideoProps}
        calculateMetadata={({ props }) => {
          // Calculate duration from captions or use default
          const lastCaption = props.captions?.[props.captions.length - 1];
          const durationInSeconds = lastCaption
            ? lastCaption.end + 2 // Add 2 seconds buffer
            : 60; // Default 60 seconds
          
          // Use video dimensions from props if available, otherwise use defaults
          const width = props.videoWidth ?? VIDEO_WIDTH;
          const height = props.videoHeight ?? VIDEO_HEIGHT;
          
          return {
            durationInFrames: Math.ceil(durationInSeconds * VIDEO_FPS),
            width,
            height,
          };
        }}
      />
    </>
  );
};
