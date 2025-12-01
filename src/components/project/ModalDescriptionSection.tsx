import { memo } from "react";

interface ModalDescriptionSectionProps {
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  madeWithLabel: string;
}

export default memo(function ModalDescriptionSection({
  description,
  tags,
  createdAt,
  updatedAt,
  madeWithLabel,
}: ModalDescriptionSectionProps) {
  return (
    <div>
      <h3 className="text-md glow-accent mb-3">Description</h3>
      <div
        className="text-sm text-text-secondary leading-relaxed mb-4"
        dangerouslySetInnerHTML={{
          __html: description.replace(/\n/g, "<br>"),
        }}
      />

      <div className="mb-4">
        <h4 className="text-sm glow mb-2">{madeWithLabel}</h4>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-bg-secondary text-text-primary border border-border-color"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="text-xs text-text-secondary">
        <div>Created: {new Date(createdAt).toLocaleDateString()}</div>
        <div>Updated: {new Date(updatedAt).toLocaleDateString()}</div>
      </div>
    </div>
  );
});
