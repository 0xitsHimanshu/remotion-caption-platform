import { AwsRegion, RenderMediaOnLambdaOutput } from "@remotion/lambda/client";
import {
  renderMediaOnLambda,
  speculateFunctionName,
} from "@remotion/lambda/client";
import { executeApi } from "../../../../helpers/api-response";
import {
  DISK,
  RAM,
  REGION,
  SITE_NAME,
  TIMEOUT,
} from "../../../../../config.mjs";
import { RenderRequest } from "../../../../types/schema";

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 10000; // 10 seconds

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes("concurrency limit") ||
      errorMessage.includes("rate exceeded") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many requests") ||
      errorMessage.includes("throttling")
    );
  }
  return false;
};

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && isRetryableError(error)) {
      const delay = Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, MAX_RETRIES - retries),
        MAX_RETRY_DELAY,
      );
      console.log(
        `Retryable error encountered. Retrying in ${delay}ms... (${retries} retries left)`,
      );
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1);
    }
    throw error;
  }
};

export const POST = executeApi<RenderMediaOnLambdaOutput, typeof RenderRequest>(
  RenderRequest,
  async (req, body) => {
    if (
      !process.env.AWS_ACCESS_KEY_ID &&
      !process.env.REMOTION_AWS_ACCESS_KEY_ID
    ) {
      throw new TypeError(
        "Set up Remotion Lambda to render videos. See the README.md for how to do so.",
      );
    }
    if (
      !process.env.AWS_SECRET_ACCESS_KEY &&
      !process.env.REMOTION_AWS_SECRET_ACCESS_KEY
    ) {
      throw new TypeError(
        "The environment variable REMOTION_AWS_SECRET_ACCESS_KEY is missing. Add it to your .env file.",
      );
    }

    // Use retry logic for renderMediaOnLambda
    const result = await retryWithBackoff(async () => {
      try {
        return await renderMediaOnLambda({
          codec: "h264",
          functionName: speculateFunctionName({
            diskSizeInMb: DISK,
            memorySizeInMb: RAM,
            timeoutInSeconds: TIMEOUT,
          }),
          region: REGION as AwsRegion,
          serveUrl: SITE_NAME,
          composition: body.id,
          inputProps: body.inputProps,
          // ⬅️ CRITICAL FIX: Limits max concurrent Lambda invocations to 5
          // This prevents hitting AWS concurrency limits
          // Remotion will automatically calculate framesPerLambda based on this
          concurrency: parseInt(
            process.env.REMOTION_MAX_CONCURRENCY || "5",
            10,
          ),
          // ⬅️ IMPORTANT: Increase timeout for delayRender() calls (video loading)
          // Default is 30000ms (30s), increased to 120s for Supabase video loading
          timeoutInMilliseconds: parseInt(
            process.env.REMOTION_RENDER_TIMEOUT_MS || "120000",
            10,
          ),
          downloadBehavior: {
            type: "download",
            fileName: "video.mp4",
          },
        });
      } catch (error) {
        // Enhance error message for concurrency limit errors
        if (isRetryableError(error)) {
          const enhancedError = new Error(
            `AWS Lambda concurrency limit reached. This usually happens when too many videos are being rendered simultaneously.\n\n` +
              `Solutions:\n` +
              `1. Wait a few moments and try again\n` +
              `2. Request a concurrency limit increase: npx remotion lambda quotas increase\n` +
              `3. Check your current limits: npx remotion lambda quotas\n` +
              `4. See troubleshooting guide: https://www.remotion.dev/docs/lambda/troubleshooting/rate-limit\n\n` +
              `Original error: ${error instanceof Error ? error.message : String(error)}`,
          );
          enhancedError.name = error instanceof Error ? error.name : "Error";
          throw enhancedError;
        }
        throw error;
      }
    });

    return result;
  },
);
