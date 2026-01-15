import { AbsoluteFill, interpolate } from "remotion";

interface BottomCenteredCaptionsProps {
  text: string;
  startTime: number;
  endTime: number;
  currentTime: number;
}

export const BottomCenteredCaptions: React.FC<
  BottomCenteredCaptionsProps
> = ({ text, startTime, endTime, currentTime }) => {
  const duration = endTime - startTime;
  const fadeDuration = Math.min(0.3, duration / 3); // Use 1/3 of duration or 0.3s, whichever is smaller
  
  // Ensure input range is always monotonically increasing
  const fadeInEnd = startTime + fadeDuration;
  const fadeOutStart = Math.max(fadeInEnd, endTime - fadeDuration);
  
  const opacity = interpolate(
    currentTime,
    [startTime, fadeInEnd, fadeOutStart, endTime],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const y = interpolate(
    currentTime,
    [startTime, fadeInEnd, fadeOutStart, endTime],
    [20, 0, 0, 20],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Use Noto Sans fonts for Hinglish support (loaded via Google Fonts CDN)
  const fontFamilyToUse = "'Noto Sans', 'Noto Sans Devanagari', sans-serif";

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 80,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          color: "#fff",
          padding: "16px 32px",
          borderRadius: 8,
          fontSize: 32,
          fontWeight: 600,
          fontFamily: fontFamilyToUse,
          textAlign: "center",
          maxWidth: "90%",
          opacity,
          transform: `translateY(${y}px)`,
          lineHeight: 1.4,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
