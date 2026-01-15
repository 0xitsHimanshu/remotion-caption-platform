"use client";

import { Player } from "@remotion/player";
import React, { useMemo, useState, useRef } from "react";
import { CaptionedVideoMain } from "../remotion/CaptionedVideo/Main";
import {
  CaptionedVideoProps,
  CaptionStyleType,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  CAPTIONED_VIDEO_COMP_NAME,
} from "../types/constants";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ErrorComp } from "../components/Error";
import { ProgressBar } from "../components/ProgressBar";
import { DownloadButton } from "../components/DownloadButton";
import { Loader2 } from "lucide-react";
import { useRendering } from "../helpers/use-rendering";

export default function CaptionStudio() {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [captions, setCaptions] = useState<
    Array<{ text: string; start: number; end: number }>
  >([]);
  const [captionStyle, setCaptionStyle] =
    useState<CaptionStyleType>("bottom-centered");
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoWidth, setVideoWidth] = useState<number>(VIDEO_WIDTH);
  const [videoHeight, setVideoHeight] = useState<number>(VIDEO_HEIGHT);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputProps: z.infer<typeof CaptionedVideoProps> = useMemo(() => {
    return {
      videoUrl,
      captions,
      style: captionStyle,
      videoWidth,
      videoHeight,
    };
  }, [videoUrl, captions, captionStyle, videoWidth, videoHeight]);

  // Calculate duration from captions
  const durationInFrames = useMemo(() => {
    if (captions.length === 0) return 300; // 10 seconds default
    const lastCaption = captions[captions.length - 1];
    return Math.ceil((lastCaption.end + 2) * VIDEO_FPS); // Add 2 seconds buffer
  }, [captions]);

  const { renderMedia, state, undo } = useRendering(
    CAPTIONED_VIDEO_COMP_NAME,
    inputProps
  );

  const handleFileSelect = async (file: File) => {
    if (file.type !== "video/mp4") {
      setError("Please upload an MP4 file");
      return;
    }

    setVideoFile(file);
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);
    // Reset dimensions to defaults until we get the actual video dimensions
    setVideoWidth(VIDEO_WIDTH);
    setVideoHeight(VIDEO_HEIGHT);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setVideoUrl(data.url);
      setUploadProgress(100);
      
      // Get video dimensions
      await getVideoDimensions(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const getVideoDimensions = (url: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      
      // Handle local file URLs - convert to API route
      let videoSource = url;
      if (url.startsWith("file://")) {
        const filePath = url.replace("file://", "");
        videoSource = `/api/video?path=${encodeURIComponent(filePath)}`;
      }
      
      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        
        if (width > 0 && height > 0) {
          setVideoWidth(width);
          setVideoHeight(height);
        }
        resolve();
      };
      
      video.onerror = () => {
        // If we can't get dimensions, use defaults
        console.warn("Could not load video metadata, using default dimensions");
        resolve();
      };
      
      video.src = videoSource;
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSelectVideoClick = () => {
    fileInputRef.current?.click();
  };

  const generateCaptions = async () => {
    if (!videoUrl) {
      setError("Please upload a video first");
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Transcription failed");
      }

      const data = await response.json();
      setCaptions(data.captions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border px-8 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Remotion Caption Platform</h1>
          {videoUrl && videoFile && (
            <span className="text-sm text-muted-foreground truncate max-w-md">{videoFile.name}</span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8 py-6 overflow-hidden min-h-0">
        {!videoUrl ? (
          /* Empty State - Upload Area */
          <div className="w-full max-w-2xl flex flex-col items-center justify-center">
            <Card
              className="border-2 border-dashed border-border bg-card p-16 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/5"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={handleSelectVideoClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="mb-6 flex justify-center">
                <svg
                  className="h-12 w-12 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M14.25 6.087c0-.355.186-.676.461-.841A6.52 6.52 0 0020.25 4.5c.967 0 1.882.182 2.75.528V6a4.5 4.5 0 00-4.494-4.5c-.711 0-1.409.1-2.07.292m0 0A6.52 6.52 0 003.75 4.5c-.967 0-1.882.182-2.75.528V6A4.5 4.5 0 007.756 6.087m0 0A6.56 6.56 0 013.75 7.5m0 0A6.56 6.56 0 0110.5 13.5M3.75 7.5v4.5A4.5 4.5 0 108.25 13.5"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-lg font-semibold">Drop video here</h2>
              <p className="mb-6 text-sm text-muted-foreground">or click to upload</p>
              <p className="mb-6 text-xs text-muted-foreground">MP4 format only</p>
              {isUploading && (
                <div className="mb-4">
                  <ProgressBar progress={uploadProgress / 100} />
                </div>
              )}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectVideoClick();
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isUploading}
              >
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                Select Video
              </Button>
            </Card>
            {error && (
              <div className="mt-4">
                <ErrorComp message={error} />
              </div>
            )}
          </div>
        ) : (
          /* Post-Upload State - 2-Column Layout */
          <div className="w-full max-w-6xl h-full flex gap-8 min-h-0">
            {/* Left Column - Video Preview */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <div className="flex-1 rounded-lg bg-black overflow-hidden shadow-lg min-h-0 flex items-center justify-center">
                {captions.length > 0 ? (
                  <div
                    className="w-full h-full"
                    style={{
                      aspectRatio: `${videoWidth} / ${videoHeight}`,
                      maxHeight: "100%",
                      maxWidth: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        maxWidth: "100%",
                        maxHeight: "100%",
                      }}
                    >
                      <Player
                        component={CaptionedVideoMain}
                        inputProps={inputProps}
                        durationInFrames={durationInFrames}
                        fps={VIDEO_FPS}
                        compositionHeight={videoHeight}
                        compositionWidth={videoWidth}
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                        controls
                        autoPlay
                        loop
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground p-4">
                    <p className="text-sm text-center">Video uploaded. Generate captions to preview.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Controls */}
            <div className="w-80 flex flex-col justify-center space-y-6 shrink-0">
                {/* Error Display */}
                {error && (
                  <div>
                    <ErrorComp message={error} />
                  </div>
                )}

                {/* Primary Action */}
                <div>
                  <Button
                    size="lg"
                    className="w-full bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 h-12"
                    onClick={generateCaptions}
                    disabled={isTranscribing}
                  >
                    {isTranscribing && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isTranscribing ? "Generating Captions..." : "Generate Captions"}
                  </Button>
                </div>

                {/* Caption Style Selection */}
                {captions.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Style
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: "bottom-centered" as CaptionStyleType, label: "Bottom Centered" },
                        { id: "top-bar" as CaptionStyleType, label: "Top Bar" },
                        { id: "karaoke" as CaptionStyleType, label: "Karaoke" },
                      ].map((style) => (
                        <label key={style.id} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="caption-style"
                            value={style.id}
                            checked={captionStyle === style.id}
                            onChange={(e) => setCaptionStyle(e.target.value as CaptionStyleType)}
                            className="h-4 w-4 border-2 border-border cursor-pointer accent-primary"
                          />
                          <span className="ml-3 text-sm text-foreground">{style.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export/Download Section */}
                {captions.length > 0 && (
                  <div className="space-y-2">
                    {state.status === "init" ||
                    state.status === "invoking" ||
                    state.status === "error" ? (
                      <>
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full text-base font-semibold h-12 border-2 bg-transparent"
                          disabled={state.status === "invoking"}
                          onClick={renderMedia}
                        >
                          {state.status === "invoking" && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          Export Video
                        </Button>
                        {state.status === "error" && (
                          <div className="mt-2">
                            <ErrorComp message={state.error.message} />
                          </div>
                        )}
                      </>
                    ) : null}
                    {state.status === "rendering" || state.status === "done" ? (
                      <>
                        <ProgressBar
                          progress={state.status === "rendering" ? state.progress : 1}
                        />
                        <div className="mt-2">
                          <DownloadButton undo={undo} state={state} />
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
