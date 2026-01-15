import { NextRequest, NextResponse } from "next/server";
import { uploadVideo } from "../../../lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "video/mp4") {
      return NextResponse.json(
        { error: "Only MP4 files are supported" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const result = await uploadVideo(file, fileName);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: result.url,
      fileName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload video",
      },
      { status: 500 }
    );
  }
}
