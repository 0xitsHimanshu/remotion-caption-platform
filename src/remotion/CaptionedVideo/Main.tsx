import { z } from "zod";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";
import { CaptionedVideoProps } from "../../types/constants";
import { BottomCenteredCaptions } from "./styles/BottomCentered";
import { TopBarCaptions } from "./styles/TopBar";
import { KaraokeCaptions } from "./styles/Karaoke";
// Noto Sans fonts are loaded via Google Fonts CDN in global.css
// This ensures Hinglish (Hindi + English) support

export const CaptionedVideoMain = ({
  videoUrl,
  captions,
  style,
}: z.infer<typeof CaptionedVideoProps>) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Get current caption based on time
  const currentCaption = captions.find(
    (caption) => currentTime >= caption.start && currentTime <= caption.end
  );

  // Handle video URL - for local files, serve via API route
  let videoSource = videoUrl;
  if (videoUrl.startsWith("file://")) {
    // For local development, serve via API route
    const filePath = videoUrl.replace("file://", "");
    videoSource = `/api/video?path=${encodeURIComponent(filePath)}`;
  }

  const renderCaption = () => {
    if (!currentCaption) return null;

    switch (style) {
      case "bottom-centered":
        return (
          <BottomCenteredCaptions
            text={currentCaption.text}
            startTime={currentCaption.start}
            endTime={currentCaption.end}
            currentTime={currentTime}
          />
        );
      case "top-bar":
        return (
          <TopBarCaptions
            text={currentCaption.text}
            startTime={currentCaption.start}
            endTime={currentCaption.end}
            currentTime={currentTime}
          />
        );
      case "karaoke":
        return (
          <KaraokeCaptions
            text={currentCaption.text}
            startTime={currentCaption.start}
            endTime={currentCaption.end}
            currentTime={currentTime}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Video
        src={videoSource}
        startFrom={0}
        // Increase timeout to 90 seconds for video loading (especially for Supabase URLs)
        delayRenderTimeoutInMilliseconds={90000}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      {renderCaption()}
    </AbsoluteFill>
  );
};
