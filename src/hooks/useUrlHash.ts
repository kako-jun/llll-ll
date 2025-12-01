import { useEffect } from "react";

interface UseUrlHashOptions {
  onHashChange: (hash: string) => void;
  deps?: unknown[];
}

export function useUrlHash({ onHashChange, deps = [] }: UseUrlHashOptions) {
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      onHashChange(hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function setUrlHash(hash: string) {
  window.history.replaceState(null, "", `#${hash}`);
}

export function clearUrlHash() {
  window.history.replaceState(null, "", window.location.pathname);
}
