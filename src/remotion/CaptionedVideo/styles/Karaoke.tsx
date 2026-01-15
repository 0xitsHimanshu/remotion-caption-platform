import { AbsoluteFill, interpolate } from "remotion";
import { useMemo } from "react";

interface KaraokeCaptionsProps {
  text: string;
  startTime: number;
  endTime: number;
  currentTime: number;
}

export const KaraokeCaptions: React.FC<KaraokeCaptionsProps> = ({
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

  // Use Noto Sans fonts for Hinglish support (loaded via Google Fonts CDN)
  const fontFamilyToUse = "'Noto Sans', 'Noto Sans Devanagari', sans-serif";

  // Split text into words for karaoke effect
  const words = useMemo(() => text.split(/\s+/), [text]);
  const wordDuration = duration / words.length;
  const progress = (currentTime - startTime) / duration;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "12px",
          padding: "20px",
          opacity,
        }}
      >
        {words.map((word, index) => {
          const wordStart = startTime + index * wordDuration;
          const wordEnd = wordStart + wordDuration;
          const isActive = currentTime >= wordStart && currentTime < wordEnd;
          const isPast = currentTime >= wordEnd;

          return (
            <span
              key={index}
              style={{
                fontSize: 42,
                fontWeight: 700,
                fontFamily: fontFamilyToUse,
                color: isActive ? "#FFD700" : isPast ? "#fff" : "#888",
                textShadow: isActive
                  ? "0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.5)"
                  : "2px 2px 8px rgba(0, 0, 0, 0.8)",
                transition: "all 0.2s ease",
                transform: isActive ? "scale(1.1)" : "scale(1)",
                backgroundColor: isActive
                  ? "rgba(255, 215, 0, 0.2)"
                  : "rgba(0, 0, 0, 0.6)",
                padding: "8px 16px",
                borderRadius: 8,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
