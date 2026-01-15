/**
 * Use autocomplete to get a list of available regions.
 * @type {import('@remotion/lambda').AwsRegion}
 */
export const REGION = (process.env.REMOTION_AWS_REGION || process.env.AWS_REGION || "us-east-1");

// Site name should be unique per deployment - use env var or generate from package.json
export const SITE_NAME = process.env.REMOTION_SITE_NAME || "remotion-caption-platform";

export const RAM = parseInt(process.env.REMOTION_LAMBDA_RAM || "3009", 10);
export const DISK = parseInt(process.env.REMOTION_LAMBDA_DISK || "10240", 10);
export const TIMEOUT = parseInt(process.env.REMOTION_LAMBDA_TIMEOUT || "240", 10);
