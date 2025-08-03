import { Language } from "@/types";

interface VisitorCounterProps {
  language: Language;
}

const VisitorCounter = ({ language }: VisitorCounterProps) => {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "2rem 0",
        margin: "2rem 0",
        borderTop: "1px solid var(--border-color)",
        borderBottom: "1px solid var(--border-color)",
        backgroundColor: "var(--card-background)",
        transition: "all 0.3s ease",
      }}
    >
      <nostalgic-counter 
        id="llll-ll-3f2d5e94" 
        type="total" 
        theme="classic" 
        digits="5"
      ></nostalgic-counter>
    </div>
  );
};

export default VisitorCounter;