import { useState, useEffect, useMemo } from "react";
import { Product, Language } from "@/types";
import { useTranslation } from "@/lib/i18n";
import { ArrowIcon } from "@/components/common";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import SearchBox from "./SearchBox";
import TagCloud from "./TagCloud";
import SortSwitch from "./SortSwitch";
import NoResults from "./NoResults";

interface ProjectListProps {
  products: Product[];
  language: Language;
}

const INITIAL_VISIBLE_COUNT = 18;
const LOAD_MORE_COUNT = 18;
const SCROLL_THRESHOLD = 1500;

export default function ProjectList({ products, language }: ProjectListProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const t = useTranslation(language);

  // URLハッシュからプロダクトIDを取得して展開
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && products.length > 0) {
      const product = products.find((p) => p.id === hash);
      if (product) {
        setExpandedProductId(hash);
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            const headerOffset = 120;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
          }
        }, 100);
      }
    }
  }, [products]);

  // プロダクト展開/閉じる時にURLハッシュを更新
  const handleToggleProduct = (productId: string) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      setExpandedProductId(productId);
      window.history.replaceState(null, "", `#${productId}`);
    }
  };

  // 全タグを抽出
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    products.forEach((product) => {
      product.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [products]);

  // フィルタリングとソート
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const title = product.title[language] || product.title["en"] || "";
      const description = product.description[language] || product.description["en"] || "";
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        title.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower) ||
        product.tags.some((tag) => tag.toLowerCase().includes(searchLower));

      const matchesTags =
        selectedTags.length === 0 || selectedTags.every((tag) => product.tags.includes(tag));

      return matchesSearch && matchesTags;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [products, language, searchTerm, selectedTags, sortOrder]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const loadMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_COUNT);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 無限スクロール
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - SCROLL_THRESHOLD) {
        if (visibleCount < filteredProducts.length) {
          loadMore();
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visibleCount, filteredProducts.length]);

  return (
    <section style={{ padding: "2rem 0" }}>
      <div className="container">
        <h2
          style={{
            fontSize: "1.8rem",
            fontWeight: "bold",
            marginBottom: "1.5rem",
            textAlign: "center",
            color: "var(--primary-color)",
          }}
        >
          {t.projectsTitle}
        </h2>

        {/* 検索・フィルター・ソートエリア */}
        <div style={{ marginBottom: "1.5rem" }}>
          <SearchBox
            value={searchTerm}
            placeholder={t.searchPlaceholder}
            onChange={setSearchTerm}
          />

          <TagCloud
            allTags={allTags}
            selectedTags={selectedTags}
            clearFiltersLabel={t.clearFilters}
            onTagToggle={toggleTag}
            onClearAll={() => setSelectedTags([])}
          />

          <SortSwitch
            sortOrder={sortOrder}
            newestLabel={t.sortNewest}
            oldestLabel={t.sortOldest}
            onToggle={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            onSetNewest={() => sortOrder === "oldest" && setSortOrder("newest")}
            onSetOldest={() => sortOrder === "newest" && setSortOrder("oldest")}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <NoResults message={t.noResults} />
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              {visibleProducts.map((product) => (
                <ProjectCard
                  key={product.id}
                  product={product}
                  language={language}
                  isExpanded={expandedProductId === product.id}
                  onToggle={handleToggleProduct}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>

            {visibleCount < filteredProducts.length && (
              <div style={{ textAlign: "center" }}>
                <button
                  onClick={loadMore}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--link-color)",
                    textDecoration: "underline",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    margin: "0 auto",
                  }}
                >
                  {t.loadMore} ({filteredProducts.length - visibleCount}件)
                  <ArrowIcon direction="down" size={16} strokeWidth={2} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ProjectModal
        product={selectedProduct}
        language={language}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
