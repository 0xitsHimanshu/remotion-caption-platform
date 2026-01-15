import {
  speculateFunctionName,
  AwsRegion,
  getRenderProgress,
} from "@remotion/lambda/client";
import { DISK, RAM, REGION, TIMEOUT } from "../../../../../config.mjs";
import { executeApi } from "../../../../helpers/api-response";
import { ProgressRequest, ProgressResponse } from "../../../../types/schema";

export const POST = executeApi<ProgressResponse, typeof ProgressRequest>(
  ProgressRequest,
  async (req, body) => {
    const renderProgress = await getRenderProgress({
      bucketName: body.bucketName,
      functionName: speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }),
      region: REGION as AwsRegion,
      renderId: body.id,
    });

    // Check for fatal errors first
    if (renderProgress.fatalErrorEncountered) {
      const errorMessage = renderProgress.errors[0]?.message || "Unknown error occurred";
      console.error("Fatal error in render:", errorMessage);
      return {
        type: "error",
        message: errorMessage,
      };
    }

    // Check for non-fatal errors that might cause issues
    if (renderProgress.errors && renderProgress.errors.length > 0) {
      const errorMessages = renderProgress.errors.map((e) => e.message).join("; ");
      console.warn("Non-fatal errors in render:", errorMessages);
    }

    // Check if render is complete
    if (renderProgress.done) {
      return {
        type: "done",
        url: renderProgress.outputFile as string,
        size: renderProgress.outputSizeInBytes as number,
      };
    }

    // Log progress for debugging
    const progress = Math.max(0.03, renderProgress.overallProgress);
    console.log(`Render progress: ${(progress * 100).toFixed(2)}%`);

    return {
      type: "progress",
      progress: progress,
    };
  },
);
