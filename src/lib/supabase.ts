import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Only create Supabase client if we have valid credentials
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const uploadVideo = async (
  file: File,
  fileName: string
): Promise<{ url: string; error: null } | { url: null; error: string }> => {
  // Prefer Supabase if configured (works for both dev and production)
  if (supabase) {
    try {
      const fileExt = fileName.split(".").pop();
      const filePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("videos")
        .upload(filePath, file, {
          contentType: "video/mp4",
          upsert: false,
        });

      if (error) {
        return { url: null, error: error.message };
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("videos").getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      return {
        url: null,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  // Fallback to local storage if Supabase is not configured
  // Note: This won't work for transcription (AssemblyAI needs public URLs)
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");

  const tmpDir = path.join(os.tmpdir(), "remotion-uploads");
  await fs.mkdir(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, fileName);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(filePath, buffer);

  // Return an API URL that can be accessed via HTTP
  // Encode the file path for the URL
  const encodedPath = encodeURIComponent(filePath);
  return { url: `/api/video?path=${encodedPath}`, error: null };

};

export const getVideoUrl = (url: string): string => {
  // If it's a file:// URL, we need to handle it differently in Remotion
  // For local development, we'll need to serve it via a local server or use absolute path
  if (url.startsWith("file://")) {
    // In production, this won't work, but for local dev we can try
    return url.replace("file://", "");
  }
  return url;
};
