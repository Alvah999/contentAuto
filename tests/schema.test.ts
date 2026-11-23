import { describe, expect, it } from "vitest";
import { validateDesignSpec } from "@content-auto/design-engine";
import { MockAiDesignProvider } from "@content-auto/ai";
import type { DesignProfile, NormalizedContent } from "@content-auto/shared";

const profile: DesignProfile = {
  id: "p1",
  name: "Test Profile",
  canvas: { width: 400, height: 600, unit: "px" },
  colors: {
    background: "#111111",
    primary: "#00AA88",
    secondary: "#888888",
    text: "#FFFFFF",
  },
  typography: {
    headline: { fontFamily: "Inter", fontSize: 32, fontWeight: 700, lineHeight: 1.2 },
    subhead: { fontFamily: "Inter", fontSize: 18, fontWeight: 500, lineHeight: 1.3 },
    body: { fontFamily: "Inter", fontSize: 14, fontWeight: 400, lineHeight: 1.4 },
    cta: { fontFamily: "Inter", fontSize: 14, fontWeight: 600, lineHeight: 1.2 },
  },
  layout: { padding: 24, gap: 12, columns: 1 },
};

const content: NormalizedContent = {
  sourceId: "c1",
  title: "Sample",
  language: "en",
  headline: "Headline",
  body: ["Body copy"],
  bullets: [],
  wordCount: 3,
  sectionCount: 2,
};

describe("designSpecSchema validation", () => {
  it("accepts a mock-generated spec", async () => {
    const ai = new MockAiDesignProvider();
    const spec = await ai.generateDesignSpec({
      content,
      profile,
      jobId: "job-1",
      title: "Sample",
    });
    const result = validateDesignSpec(spec);
    expect(result.valid).toBe(true);
    expect(result.data?.root.type).toBe("FRAME");
    expect(result.data?.root.children?.length).toBeGreaterThan(0);
  });

  it("rejects invalid specs", () => {
    const result = validateDesignSpec({
      version: "2.0",
      id: "",
      name: "bad",
    });
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});
