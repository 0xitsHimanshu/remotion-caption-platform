import { NextRequest, NextResponse } from "next/server";
import { TranscriptionRequest } from "../../../types/schema";
import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl } = TranscriptionRequest.parse(body);

    if (!process.env.ASSEMBLYAI_API_KEY) {
      return NextResponse.json(
        { error: "AssemblyAI API key not configured. Please set ASSEMBLYAI_API_KEY in your .env.local file." },
        { status: 500 }
      );
    }

    // Validate API key format (AssemblyAI keys typically start with a prefix)
    if (process.env.ASSEMBLYAI_API_KEY.length < 20) {
      console.warn("AssemblyAI API key appears to be invalid (too short)");
    }

    // Convert file:// URLs to API URLs, or handle relative API URLs
    let audioUrl = videoUrl;
    
    if (videoUrl.startsWith("file://")) {
      // Convert file:// URL to API route
      const filePath = videoUrl.replace("file://", "");
      const encodedPath = encodeURIComponent(filePath);
      // Get the base URL from the request
      const baseUrl = request.nextUrl.origin;
      audioUrl = `${baseUrl}/api/video?path=${encodedPath}`;
    } else if (videoUrl.startsWith("/api/video")) {
      // If it's already a relative API URL, make it absolute
      const baseUrl = request.nextUrl.origin;
      audioUrl = `${baseUrl}${videoUrl}`;
    }
    
    // Check if URL is publicly accessible (not localhost for external services)
    // Note: AssemblyAI needs a publicly accessible URL, so localhost won't work
    if (audioUrl.includes("localhost") || audioUrl.includes("127.0.0.1")) {
      return NextResponse.json(
        {
          error:
            "Localhost URLs are not accessible to transcription services. Please configure Supabase storage (NEXT_PUBLIC_SUPABASE_URL) for transcription to work, or use a publicly accessible URL.",
        },
        { status: 400 }
      );
    }

    // Log the URL being used for debugging (remove in production)
    console.log("Transcribing video URL:", audioUrl);

    // Start transcription
    let transcript;
    try {
      transcript = await Promise.race([
        client.transcripts.transcribe({
          audio: audioUrl,
          language_detection: true,
        }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Transcription request timeout after 30 seconds")),
            30000
          )
        ),
      ]) as Awaited<ReturnType<typeof client.transcripts.transcribe>>;
    } catch (error) {
      console.error("AssemblyAI connection error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error && 'cause' in error ? error.cause : undefined,
        videoUrl: audioUrl,
      });
      
      // Check if it's a network/connection error
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        const errorString = String(error).toLowerCase();
        
        if (
          errorMessage.includes("timeout") || 
          errorMessage.includes("econnrefused") || 
          errorMessage.includes("fetch failed") ||
          errorString.includes("connect timeout") ||
          errorString.includes("und_err_connect_timeout")
        ) {
          return NextResponse.json(
            {
              error:
                "Unable to connect to AssemblyAI transcription service. Connection timeout after 10 seconds.\n\n" +
                "Possible causes:\n" +
                "1. Firewall or network blocking outbound HTTPS connections to AssemblyAI servers\n" +
                "2. Corporate network restrictions or proxy settings required\n" +
                "3. Internet connectivity issues\n" +
                "4. AssemblyAI service temporarily unavailable\n\n" +
                "Solutions:\n" +
                "• Check your firewall/antivirus settings and allow connections to api.assemblyai.com\n" +
                "• If behind a corporate firewall, contact IT to whitelist AssemblyAI domains\n" +
                "• Verify internet connectivity: try accessing https://api.assemblyai.com in your browser\n" +
                "• Check if a proxy is required and configure it in your environment\n" +
                "• Ensure the video URL is publicly accessible (not localhost)",
            },
            { status: 503 }
          );
        }
      }
      
      throw error; // Re-throw if it's a different error
    }

    // Wait for transcription to complete
    let finalTranscript = transcript;
    while (
      finalTranscript.status === "queued" ||
      finalTranscript.status === "processing"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds for better UX while still efficient
      finalTranscript = await client.transcripts.get(finalTranscript.id);
    }

    if (finalTranscript.status === "error") {
      return NextResponse.json(
        { error: "Transcription failed", details: finalTranscript.error },
        { status: 500 }
      );
    }

    // Convert words to captions with timing (4-7 words per caption for lyrical feel)
    const captions: Array<{ text: string; start: number; end: number }> = [];

    if (finalTranscript.words) {
      const minWordsPerCaption = 4;
      const maxWordsPerCaption = 7;
      let wordCount = 0;
      let currentCaption = "";
      let captionStart = finalTranscript.words[0]?.start || 0;
      let captionEnd = finalTranscript.words[0]?.end || 0;

      for (let i = 0; i < finalTranscript.words.length; i++) {
        const word = finalTranscript.words[i];
        const nextWord = finalTranscript.words[i + 1];

        currentCaption += (currentCaption ? " " : "") + word.text;
        captionEnd = word.end;
        wordCount++;

        // Calculate pause duration
        const pauseDuration = nextWord ? (nextWord.start - captionEnd) / 1000 : 0;

        // Break caption logic:
        // 1. If we've reached max words (7), break
        // 2. If we have at least min words (4) AND there's a long pause (>1.2s), break
        // 3. If we have at least min words AND it's end of sentence (strong punctuation), break
        // 4. If no next word (end of transcript), break
        const shouldBreak =
          wordCount >= maxWordsPerCaption ||
          (wordCount >= minWordsPerCaption && pauseDuration > 1.2) ||
          (wordCount >= minWordsPerCaption && word.text.match(/[.!?]$/)) ||
          !nextWord;

        if (shouldBreak) {
          captions.push({
            text: currentCaption.trim(),
            start: captionStart / 1000, // Convert to seconds
            end: captionEnd / 1000,
          });

          if (nextWord) {
            currentCaption = "";
            captionStart = nextWord.start;
            wordCount = 0;
          }
        }
      }

      // Add final caption if any remaining
      if (currentCaption.trim()) {
        captions.push({
          text: currentCaption.trim(),
          start: captionStart / 1000,
          end: captionEnd / 1000,
        });
      }
    } else if (finalTranscript.text) {
      // Fallback: if no word-level timestamps, create a single caption
      captions.push({
        text: finalTranscript.text,
        start: 0,
        end: (finalTranscript.audio_duration || 0) / 1000,
      });
    }

    return NextResponse.json({
      text: finalTranscript.text,
      fullText: finalTranscript.text, // Backward compatibility
      captions,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to transcribe video",
      },
      { status: 500 }
    );
  }
}
