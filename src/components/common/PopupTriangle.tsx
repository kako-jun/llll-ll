import { memo } from "react";

interface PopupTriangleProps {
  direction: "up" | "down";
  position: number | "center";
  borderColor?: string;
  fillColor?: string;
}

export default memo(function PopupTriangle({
  direction,
  position,
  borderColor = "var(--primary-color)",
  fillColor = "var(--input-background)",
}: PopupTriangleProps) {
  const positionStyle =
    position === "center"
      ? { left: "50%", transform: "translateX(-50%)" }
      : { left: `${position}px`, transform: "translateX(-50%)" };

  const isUp = direction === "up";

  return (
    <>
      {/* Outer triangle (border) */}
      <div
        style={{
          position: "absolute",
          ...(isUp ? { top: "-14px" } : { bottom: "-14px" }),
          ...positionStyle,
          width: "0",
          height: "0",
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          ...(isUp
            ? { borderBottom: `14px solid ${borderColor}` }
            : { borderTop: `14px solid ${borderColor}` }),
        }}
      />
      {/* Inner triangle (fill) */}
      <div
        style={{
          position: "absolute",
          ...(isUp ? { top: "-12px" } : { bottom: "-12px" }),
          ...positionStyle,
          width: "0",
          height: "0",
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          ...(isUp
            ? { borderBottom: `12px solid ${fillColor}` }
            : { borderTop: `12px solid ${fillColor}` }),
        }}
      />
    </>
  );
});
