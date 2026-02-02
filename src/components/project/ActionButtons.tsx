import { memo } from "react";

const ExternalLinkIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const ArticleIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

interface Article {
  label: string;
  url: string;
}

interface ActionButtonsProps {
  demoUrl?: string;
  repositoryUrl?: string;
  articles?: Article[];
  labels: {
    viewDemo: string;
    viewCode: string;
  };
}

const PrimaryButton = memo(function PrimaryButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        backgroundColor: "var(--primary-color)",
        color: "#ffffff",
        textDecoration: "none",
        borderRadius: "0.25rem",
        fontSize: "0.9rem",
        fontWeight: "bold",
        transition: "opacity 0.2s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
      onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
      onClick={(e) => e.stopPropagation()}
    >
      {icon}
      {label}
    </a>
  );
});

const SecondaryButton = memo(function SecondaryButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        backgroundColor: "var(--background-color)",
        color: "var(--link-color)",
        textDecoration: "none",
        border: "1px solid var(--border-color)",
        borderRadius: "0.25rem",
        fontSize: "0.9rem",
        transition: "background-color 0.2s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--hover-background)")}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "var(--background-color)")}
      onClick={(e) => e.stopPropagation()}
    >
      {icon}
      {label}
    </a>
  );
});

export default memo(function ActionButtons({
  demoUrl,
  repositoryUrl,
  articles,
  labels,
}: ActionButtonsProps) {
  const hasButtons = demoUrl || repositoryUrl || articles?.length;
  if (!hasButtons) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      {demoUrl && (
        <PrimaryButton href={demoUrl} label={labels.viewDemo} icon={<ExternalLinkIcon />} />
      )}
      {repositoryUrl && (
        <SecondaryButton href={repositoryUrl} label={labels.viewCode} icon={<GitHubIcon />} />
      )}
      {articles?.map((article, index) => (
        <SecondaryButton
          key={`article-${index}`}
          href={article.url}
          label={article.label}
          icon={<ArticleIcon />}
        />
      ))}
    </div>
  );
});
