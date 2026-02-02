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
    className="inline-block mr-1"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="inline-block mr-1">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const BlogIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="inline-block mr-1"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
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
    className="inline-block mr-1"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const SupportIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="inline-block mr-1"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

interface Article {
  label: string;
  url: string;
}

interface ModalLinksProps {
  demoUrl?: string;
  repositoryUrl?: string;
  blogUrl?: string[];
  articles?: Article[];
  supportUrl?: string;
  labels: {
    viewDemo: string;
    viewCode: string;
    viewBlog: string;
    support: string;
  };
}

const LinkButton = memo(function LinkButton({
  href,
  variant,
  children,
}: {
  href: string;
  variant: "primary" | "secondary" | "accent" | "muted";
  children: React.ReactNode;
}) {
  const variantStyles = {
    primary: "bg-text-primary text-bg-primary hover:bg-text-accent",
    secondary:
      "border border-text-primary text-text-primary hover:bg-text-primary hover:text-bg-primary",
    accent: "border border-text-accent text-text-accent hover:bg-text-accent hover:text-bg-primary",
    muted:
      "border border-text-secondary text-text-secondary hover:bg-text-secondary hover:text-bg-primary",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`block px-4 py-2 transition-colors text-center text-sm ${variantStyles[variant]}`}
    >
      {children}
    </a>
  );
});

export default memo(function ModalLinks({
  demoUrl,
  repositoryUrl,
  blogUrl,
  articles,
  supportUrl,
  labels,
}: ModalLinksProps) {
  return (
    <div className="space-y-3">
      {demoUrl && (
        <LinkButton href={demoUrl} variant="primary">
          <ExternalLinkIcon />
          {labels.viewDemo}
        </LinkButton>
      )}

      {repositoryUrl && (
        <LinkButton href={repositoryUrl} variant="secondary">
          <GitHubIcon />
          {labels.viewCode}
        </LinkButton>
      )}

      {blogUrl?.map((url, index) => (
        <LinkButton key={`blog-${index}`} href={url} variant="accent">
          <BlogIcon />
          {labels.viewBlog}
        </LinkButton>
      ))}

      {articles?.map((article, index) => (
        <LinkButton key={`article-${index}`} href={article.url} variant="accent">
          <ArticleIcon />
          {article.label}
        </LinkButton>
      ))}

      {supportUrl && (
        <LinkButton href={supportUrl} variant="muted">
          <SupportIcon />
          {labels.support}
        </LinkButton>
      )}
    </div>
  );
});
