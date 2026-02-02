import { memo } from "react";
import MediaGrid from "./MediaGrid";
import TagList from "./TagList";
import ActionButtons from "./ActionButtons";

interface Article {
  label: string;
  url: string;
}

interface ExpandedViewProps {
  images: string[];
  videos?: string[];
  animations?: string[];
  tags: string[];
  title: string;
  noImageText: string;
  demoUrl?: string;
  repositoryUrl?: string;
  articles?: Article[];
  labels: {
    viewDemo: string;
    viewCode: string;
  };
  onImageClick: (src: string, e: React.MouseEvent) => void;
  onVideoClick: (src: string, e: React.MouseEvent) => void;
}

export default memo(function ExpandedView({
  images,
  videos,
  animations,
  tags,
  title,
  noImageText,
  demoUrl,
  repositoryUrl,
  articles,
  labels,
  onImageClick,
  onVideoClick,
}: ExpandedViewProps) {
  return (
    <div
      style={{
        padding: "1rem",
        borderTop: "1px solid var(--border-color)",
        backgroundColor: "var(--background-color)",
        animation: "slideDown 0.3s ease-out",
      }}
    >
      <MediaGrid
        images={images}
        videos={videos}
        animations={animations}
        title={title}
        noImageText={noImageText}
        onImageClick={onImageClick}
        onVideoClick={onVideoClick}
      />

      <TagList tags={tags} />

      <ActionButtons
        demoUrl={demoUrl}
        repositoryUrl={repositoryUrl}
        articles={articles}
        labels={labels}
      />
    </div>
  );
});
