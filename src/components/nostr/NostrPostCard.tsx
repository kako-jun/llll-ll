import { memo } from "react";
import { nip19 } from "nostr-tools";

interface NostrPost {
  id: string;
  content: string;
  created_at: number;
}

interface NostrPostCardProps {
  post: NostrPost;
}

const HashtagLink = memo(function HashtagLink({ tag }: { tag: string }) {
  return (
    <a
      href={`https://iris.to/search/${encodeURIComponent(tag)}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "var(--primary-color)",
        textDecoration: "none",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.textDecoration = "underline";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.textDecoration = "none";
      }}
    >
      {tag}
    </a>
  );
});

const PostImage = memo(function PostImage({ url, index }: { url: string; index: number }) {
  return (
    <img
      src={url}
      alt={`Image ${index + 1}`}
      style={{
        maxWidth: "100%",
        height: "auto",
        borderRadius: "4px",
        border: "1px solid var(--border-color)",
      }}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
});

export default memo(function NostrPostCard({ post }: NostrPostCardProps) {
  // 画像URLを抽出
  const imageUrls = post.content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi) || [];

  // 画像URL以外のテキスト
  let textContent = post.content;
  imageUrls.forEach((url) => {
    textContent = textContent.replace(url, "").trim();
  });

  return (
    <div
      style={{
        padding: "1rem",
        backgroundColor: "var(--background-color)",
        border: "1px solid var(--border-color)",
        borderRadius: "8px",
      }}
    >
      <div style={{ marginBottom: "0.5rem" }}>
        {textContent && (
          <p
            style={{
              fontSize: "0.9rem",
              lineHeight: "1.6",
              wordBreak: "break-word",
              marginBottom: imageUrls.length > 0 ? "1rem" : "0",
              whiteSpace: "pre-wrap",
            }}
          >
            {textContent.split(/(#[^\s#]+)/g).map((part, index) => {
              if (part.startsWith("#")) {
                return <HashtagLink key={index} tag={part} />;
              }
              return part;
            })}
          </p>
        )}

        {imageUrls.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {imageUrls.map((url, index) => (
              <PostImage key={index} url={url} index={index} />
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <small
          style={{
            color: "var(--muted-text)",
            fontSize: "0.8rem",
          }}
        >
          {new Date(post.created_at * 1000).toISOString().split("T")[0]}
        </small>
        <a
          href={`https://iris.to/${nip19.noteEncode(post.id)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--link-color)",
            fontSize: "0.8rem",
            textDecoration: "none",
            padding: "0.2rem 0.5rem",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "var(--hover-color, rgba(0,0,0,0.1))";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          View on Iris
        </a>
      </div>
    </div>
  );
});
