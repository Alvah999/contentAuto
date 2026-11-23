import { describe, expect, it } from "vitest";
import { normalizeContent } from "@content-auto/content";
import type { ContentScript } from "@content-auto/shared";

const sample: ContentScript = {
  id: "test-script",
  title: "  Test Title  ",
  brand: "Acme",
  channel: "story",
  language: "en",
  sections: [
    { id: "1", role: "headline", text: "Hello World", order: 2 },
    { id: "2", role: "body", text: "First paragraph here.", order: 3 },
    { id: "3", role: "cta", text: "Click me", order: 5 },
    { id: "4", role: "bullet", text: "Point A", order: 4 },
    { id: "5", role: "subhead", text: "A subhead", order: 1 },
    { id: "6", role: "body", text: "Second paragraph.", order: 6 },
    { id: "7", role: "caption", text: "Fine print", order: 7 },
  ],
};

describe("normalizeContent", () => {
  it("extracts roles and sorts by order", () => {
    const normalized = normalizeContent(sample);
    expect(normalized.sourceId).toBe("test-script");
    expect(normalized.title).toBe("Test Title");
    expect(normalized.headline).toBe("Hello World");
    expect(normalized.subhead).toBe("A subhead");
    expect(normalized.cta).toBe("Click me");
    expect(normalized.caption).toBe("Fine print");
    expect(normalized.body).toEqual(["First paragraph here.", "Second paragraph."]);
    expect(normalized.bullets).toEqual(["Point A"]);
    expect(normalized.sectionCount).toBe(7);
    expect(normalized.wordCount).toBeGreaterThan(0);
  });

  it("defaults language to en", () => {
    const normalized = normalizeContent({
      ...sample,
      language: undefined,
    });
    expect(normalized.language).toBe("en");
  });
});
