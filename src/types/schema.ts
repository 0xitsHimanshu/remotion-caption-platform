import { z } from "zod";
import { CompositionProps, CaptionedVideoProps } from "./constants";

export const RenderRequest = z.object({
  id: z.string(),
  inputProps: z.union([CompositionProps, CaptionedVideoProps]),
});

export const ProgressRequest = z.object({
  bucketName: z.string(),
  id: z.string(),
});

export const UploadRequest = z.object({
  fileName: z.string(),
  fileType: z.string(),
});

export const TranscriptionRequest = z.object({
  videoUrl: z.string(),
});

export type ProgressResponse =
  | {
      type: "error";
      message: string;
    }
  | {
      type: "progress";
      progress: number;
    }
  | {
      type: "done";
      url: string;
      size: number;
    };
