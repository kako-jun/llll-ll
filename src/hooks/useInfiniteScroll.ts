import { useEffect } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  onLoadMore: () => void;
  hasMore: boolean;
}

export function useInfiniteScroll({
  threshold = 1500,
  onLoadMore,
  hasMore,
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - threshold) {
        if (hasMore) {
          onLoadMore();
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, onLoadMore, hasMore]);
}
