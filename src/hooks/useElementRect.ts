import { useState, useEffect, useCallback } from "react";

export function useElementRect(selector: string) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      setRect(element.getBoundingClientRect());
    }
  }, [selector]);

  useEffect(() => {
    updateRect();

    window.addEventListener("scroll", updateRect);
    window.addEventListener("resize", updateRect);

    return () => {
      window.removeEventListener("scroll", updateRect);
      window.removeEventListener("resize", updateRect);
    };
  }, [updateRect]);

  return { rect, updateRect };
}
