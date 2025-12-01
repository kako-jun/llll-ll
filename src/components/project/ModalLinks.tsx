import { memo } from "react";

interface ModalLinksProps {
  demoUrl?: string;
  repositoryUrl?: string;
  blogUrl?: string[];
  developmentRecordUrl?: string[];
  supportUrl?: string;
  labels: {
    viewDemo: string;
    viewCode: string;
    viewBlog: string;
    viewDevelopmentRecord: string;
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
  developmentRecordUrl,
  supportUrl,
  labels,
}: ModalLinksProps) {
  return (
    <div className="space-y-3">
      {demoUrl && (
        <LinkButton href={demoUrl} variant="primary">
          {labels.viewDemo}
        </LinkButton>
      )}

      {repositoryUrl && (
        <LinkButton href={repositoryUrl} variant="secondary">
          {labels.viewCode}
        </LinkButton>
      )}

      {blogUrl?.map((url, index) => (
        <LinkButton key={`blog-${index}`} href={url} variant="accent">
          {labels.viewBlog}
        </LinkButton>
      ))}

      {developmentRecordUrl?.map((url, index) => (
        <LinkButton key={`dev-${index}`} href={url} variant="accent">
          {labels.viewDevelopmentRecord}
          {developmentRecordUrl.length > 1 ? ` ${index + 1}` : ""}
        </LinkButton>
      ))}

      {supportUrl && (
        <LinkButton href={supportUrl} variant="muted">
          {labels.support}
        </LinkButton>
      )}
    </div>
  );
});
