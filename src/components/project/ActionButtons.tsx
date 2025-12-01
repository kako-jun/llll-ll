import { memo } from "react";

interface ActionButtonsProps {
  demoUrl?: string;
  repositoryUrl?: string;
  developmentRecordUrl?: string[];
  labels: {
    viewDemo: string;
    viewCode: string;
    viewDevelopmentRecord: string;
  };
}

const PrimaryButton = memo(function PrimaryButton({
  href,
  label,
}: {
  href: string;
  label: string;
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
      {label}
    </a>
  );
});

const SecondaryButton = memo(function SecondaryButton({
  href,
  label,
}: {
  href: string;
  label: string;
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
      {label}
    </a>
  );
});

export default memo(function ActionButtons({
  demoUrl,
  repositoryUrl,
  developmentRecordUrl,
  labels,
}: ActionButtonsProps) {
  const hasButtons = demoUrl || repositoryUrl || developmentRecordUrl?.length;
  if (!hasButtons) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      {demoUrl && <PrimaryButton href={demoUrl} label={labels.viewDemo} />}
      {repositoryUrl && <SecondaryButton href={repositoryUrl} label={labels.viewCode} />}
      {developmentRecordUrl && developmentRecordUrl.length > 0 && (
        <SecondaryButton href={developmentRecordUrl[0]} label={labels.viewDevelopmentRecord} />
      )}
    </div>
  );
});
