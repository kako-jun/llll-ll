// 汎用的な矢印・アイコンコンポーネント
interface ArrowIconProps {
  direction?: "up" | "down" | "left" | "right" | "close";
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function ArrowIcon({
  direction = "up",
  size = 20,
  strokeWidth = 2,
  className,
  style,
}: ArrowIconProps) {
  const getPath = () => {
    switch (direction) {
      case "up":
        return "M7 14L12 9L17 14";
      case "down":
        return "M7 10L12 15L17 10";
      case "left":
        return "M14 7L9 12L14 17";
      case "right":
        return "M10 7L15 12L10 17";
      case "close":
        return "M18 6L6 18M6 6L18 18";
      default:
        return "M7 14L12 9L17 14";
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d={getPath()}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
