import { useState, useEffect } from "react";
import { Product, Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import { ArrowIcon } from "@/components/common";
import ImageGallery from "./ImageGallery";
import ModalDescriptionSection from "./ModalDescriptionSection";
import ModalLinks from "./ModalLinks";

interface ProjectModalProps {
  product: Product | null;
  language: Language;
  onClose: () => void;
}

export default function ProjectModal({ product, language, onClose }: ProjectModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const t = useTranslation(language);

  useEffect(() => {
    if (product) {
      setCurrentImageIndex(0);
    }
  }, [product]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!product) return null;

  const title = product.title[language] || product.title["en"] || "Untitled";
  const description = product.description[language] || product.description["en"] || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto pixel-border bg-bg-primary">
        {/* Header */}
        <div className="sticky top-0 bg-bg-primary border-b border-border-color p-4 flex justify-between items-center">
          <h2 className="text-lg glow">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-accent hover:text-text-primary text-xl flex items-center justify-center w-8 h-8 rounded-full hover:bg-hover-background transition-colors"
            title="閉じる"
          >
            <ArrowIcon direction="close" size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <ImageGallery
            images={product.images}
            currentIndex={currentImageIndex}
            title={title}
            onIndexChange={setCurrentImageIndex}
          />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Description & Tags */}
            <ModalDescriptionSection
              description={description}
              tags={product.tags}
              createdAt={product.createdAt}
              updatedAt={product.updatedAt}
              madeWithLabel={t.madeWith}
            />

            {/* Right Column - Links */}
            <div>
              <h3 className="text-md glow-accent mb-3">Links</h3>
              <ModalLinks
                demoUrl={product.demoUrl}
                repositoryUrl={product.repositoryUrl}
                blogUrl={product.blogUrl}
                developmentRecordUrl={product.developmentRecordUrl}
                supportUrl={product.supportUrl}
                labels={{
                  viewDemo: t.viewDemo,
                  viewCode: t.viewCode,
                  viewBlog: t.viewBlog,
                  viewDevelopmentRecord: t.viewDevelopmentRecord,
                  support: t.support,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
