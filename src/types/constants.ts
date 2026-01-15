import { z } from "zod";
export const CAPTIONED_VIDEO_COMP_NAME = "CaptionedVideo";

export const CaptionStyle = z.enum(["bottom-centered", "top-bar", "karaoke"]);
export type CaptionStyleType = z.infer<typeof CaptionStyle>;

export const CaptionSegment = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
});

export const CompositionProps = z.object({
  title: z.string(),
});

export const CaptionedVideoProps = z.object({
  videoUrl: z.string(),
  captions: z.array(CaptionSegment),
  style: CaptionStyle,
  videoWidth: z.number().optional(),
  videoHeight: z.number().optional(),
});

export const DURATION_IN_FRAMES = 200;
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
export const VIDEO_FPS = 30;

export const defaultCaptionedVideoProps: z.infer<typeof CaptionedVideoProps> = {
  videoUrl: "",
  captions: [],
  style: "bottom-centered",
  videoWidth: VIDEO_WIDTH,
  videoHeight: VIDEO_HEIGHT,
};
