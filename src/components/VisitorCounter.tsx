import { Language } from "@/types";

interface VisitorCounterProps {
  language: Language;
}

const VisitorCounter = ({}: VisitorCounterProps) => {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "1.5rem 0 1rem 0",
        margin: "2rem 0 1rem 0",
        borderTop: "1px solid var(--border-color)",
        borderBottom: "1px solid var(--border-color)",
        backgroundColor: "var(--card-background)",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ transform: "scale(1.5)", display: "inline-block" }}>
        <nostalgic-counter id="llll-ll-f843ad67" type="total" theme="classic" digits="5"></nostalgic-counter>
      </div>
    </div>
  );
};

export default VisitorCounter;
