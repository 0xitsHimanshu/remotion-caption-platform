import { AbsoluteFill, interpolate } from "remotion";

interface TopBarCaptionsProps {
  text: string;
  startTime: number;
  endTime: number;
  currentTime: number;
}

export const TopBarCaptions: React.FC<TopBarCaptionsProps> = ({
  text,
  startTime,
  endTime,
  currentTime,
}) => {
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

  const x = interpolate(
    currentTime,
    [startTime, fadeInEnd, fadeOutStart, endTime],
    [-100, 0, 0, 100],
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
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 40,
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          color: "#fff",
          padding: "20px 40px",
          width: "100%",
          fontSize: 28,
          fontWeight: 600,
          fontFamily: fontFamilyToUse,
          textAlign: "center",
          opacity,
          transform: `translateX(${x}px)`,
          lineHeight: 1.5,
          borderBottom: "3px solid #fff",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
