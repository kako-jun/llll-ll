import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const zolaRoot = join(__dirname, "..");
const postsDir = join(zolaRoot, "content", "posts");

function read(rel) {
  return readFileSync(join(zolaRoot, rel), "utf8");
}

function frontmatter(file) {
  const raw = readFileSync(join(postsDir, file), "utf8");
  const parts = raw.split("+++");
  return parts.length >= 3 ? parts[1] : "";
}

const postFiles = readdirSync(postsDir)
  .filter((f) => f.endsWith(".md"))
  .filter((f) => !f.startsWith("_index"));

describe("blog infrastructure", () => {
  it("uses tags taxonomy only, not categories", () => {
    const config = read("config.toml");
    expect(config).toMatch(/\[\[taxonomies\]\]\s+name = "tags"/);
    expect(config).not.toMatch(/name = "categories"/);
    expect(config).not.toMatch(/name = "category"/);
  });

  it("keeps extra.tags and taxonomies.tags in sync for existing posts", () => {
    for (const file of postFiles) {
      const fm = frontmatter(file);
      const extra = fm.match(/\[extra\][\s\S]*?tags\s*=\s*(\[[^\n]+\])/);
      if (!extra) continue;

      const tax = fm.match(/\[taxonomies\][\s\S]*?tags\s*=\s*(\[[^\n]+\])/);
      expect(tax, `${file} should define [taxonomies].tags`).not.toBeNull();
      expect(tax[1]).toBe(extra[1]);
    }
  });

  it("links blog pages to tags, archive, share, comments, and related posts", () => {
    const postsTemplate = read("templates/posts.html");
    const postTemplate = read("templates/post.html");

    expect(postsTemplate).toContain("get_taxonomy_url(kind='tags'");
    expect(postsTemplate).toContain("archive_title");
    expect(postTemplate).toContain("share_links");
    expect(postTemplate).toContain("nostalgic_bbs.toml");
    expect(postTemplate).toContain("related_posts");
    expect(postTemplate).toContain("get_taxonomy(kind=\"tags\"");
  });

  it("keeps hash display only on actual tag names", () => {
    const postsTemplate = read("templates/posts.html");
    const archiveTemplate = read("templates/archive.html");
    const tagsListTemplate = read("templates/tags/list.html");

    expect(postsTemplate).not.toContain("# {{ trans(key=\"tags_title\"");
    expect(archiveTemplate).not.toContain("# {{ trans(key=\"tags_title\"");
    expect(tagsListTemplate).toContain('<span class="tag-name">#{{ term.name }}</span>');
  });

  it("has a committed BBS id map for every current post", () => {
    const bbs = read("data/nostalgic_bbs.toml");
    const ids = [...bbs.matchAll(/^"([^"]+)"\s*=\s*"([^"]+)"$/gm)];
    expect(ids.length).toBe(postFiles.length);
  });
});
