import type { ContentScript, NormalizedContent } from "@content-auto/shared";

/**
 * Normalize a content script into a stable structure for AI design planning.
 */
export function normalizeContent(script: ContentScript): NormalizedContent {
  const sorted = [...script.sections].sort((a, b) => a.order - b.order);

  const byRole = (role: ContentScript["sections"][number]["role"]) =>
    sorted.filter((s) => s.role === role).map((s) => s.text.trim()).filter(Boolean);

  const headline = byRole("headline")[0];
  const subhead = byRole("subhead")[0];
  const body = byRole("body");
  const cta = byRole("cta")[0];
  const bullets = byRole("bullet");
  const caption = byRole("caption")[0];

  const allText = sorted.map((s) => s.text.trim()).filter(Boolean);
  const wordCount = allText
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    sourceId: script.id,
    title: script.title.trim(),
    brand: script.brand?.trim(),
    channel: script.channel?.trim(),
    language: (script.language ?? "en").trim() || "en",
    headline,
    subhead,
    body,
    cta,
    bullets,
    caption,
    wordCount,
    sectionCount: sorted.length,
  };
}
