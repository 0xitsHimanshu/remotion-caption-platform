import { z } from "zod";
import { useCallback, useMemo, useState } from "react";
import { getProgress, renderVideo } from "../lambda/api";
import { CompositionProps, CaptionedVideoProps } from "../types/constants";

export type State =
  | {
      status: "init";
    }
  | {
      status: "invoking";
    }
  | {
      renderId: string;
      bucketName: string;
      progress: number;
      status: "rendering";
    }
  | {
      renderId: string | null;
      status: "error";
      error: Error;
    }
  | {
      url: string;
      size: number;
      status: "done";
    };

const wait = async (milliSeconds: number) => {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliSeconds);
  });
};

export const useRendering = (
  id: string,
  inputProps: z.infer<typeof CompositionProps> | z.infer<typeof CaptionedVideoProps>,
) => {
  const [state, setState] = useState<State>({
    status: "init",
  });

  const renderMedia = useCallback(async () => {
    setState({
      status: "invoking",
    });
    try {
      const { renderId, bucketName } = await renderVideo({ id, inputProps });
      setState({
        status: "rendering",
        progress: 0,
        renderId: renderId,
        bucketName: bucketName,
      });

      let pending = true;
      let lastProgress = 0;
      let progressStuckCount = 0;
      const MAX_STUCK_ITERATIONS = 60; // 60 seconds of no progress = timeout
      const PROGRESS_THRESHOLD = 0.001; // Consider progress stuck if change is less than 0.1%

      while (pending) {
        const result = await getProgress({
          id: renderId,
          bucketName: bucketName,
        });
        switch (result.type) {
          case "error": {
            setState({
              status: "error",
              renderId: renderId,
              error: new Error(result.message),
            });
            pending = false;
            break;
          }
          case "done": {
            setState({
              size: result.size,
              url: result.url,
              status: "done",
            });
            pending = false;
            break;
          }
          case "progress": {
            const currentProgress = result.progress;
            const progressChange = Math.abs(currentProgress - lastProgress);
            
            // Check if progress is stuck
            if (progressChange < PROGRESS_THRESHOLD) {
              progressStuckCount++;
              if (progressStuckCount >= MAX_STUCK_ITERATIONS) {
                setState({
                  status: "error",
                  renderId: renderId,
                  error: new Error(
                    `Rendering appears to be stuck at ${(currentProgress * 100).toFixed(1)}% progress. ` +
                    `This may indicate a timeout or error. Please try again or check AWS CloudWatch logs.`
                  ),
                });
                pending = false;
                break;
              }
            } else {
              // Progress is moving, reset stuck counter
              progressStuckCount = 0;
            }
            
            lastProgress = currentProgress;
            setState({
              status: "rendering",
              bucketName: bucketName,
              progress: currentProgress,
              renderId: renderId,
            });
            await wait(1000);
          }
        }
      }
    } catch (err) {
      setState({
        status: "error",
        error: err as Error,
        renderId: null,
      });
    }
  }, [id, inputProps]);

  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  return useMemo(() => {
    return {
      renderMedia,
      state,
      undo,
    };
  }, [renderMedia, state, undo]);
};
