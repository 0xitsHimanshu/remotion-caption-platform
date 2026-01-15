import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "Path parameter required" }, { status: 400 });
    }

    // Security: Only allow files from tmp directory
    const normalizedPath = path.normalize(filePath);
    // Check for tmp/remotion-uploads in path (works on both Unix and Windows)
    const tmpPattern = path.sep === "\\" 
      ? normalizedPath.replace(/\\/g, "/").includes("tmp/remotion-uploads")
      : normalizedPath.includes(path.join("tmp", "remotion-uploads"));
    
    if (!tmpPattern) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    if (!existsSync(normalizedPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await readFile(normalizedPath);
    const fileExt = path.extname(normalizedPath).toLowerCase();

    const contentType =
      fileExt === ".mp4"
        ? "video/mp4"
        : fileExt === ".webm"
        ? "video/webm"
        : "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Video serving error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to serve video",
      },
      { status: 500 }
    );
  }
}
