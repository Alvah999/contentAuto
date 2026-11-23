import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { MockAiDesignProvider } from "@content-auto/ai";
import { LocalJsonContentProvider, normalizeContent } from "@content-auto/content";
import { LocalJsonProfileProvider, validateDesignSpec } from "@content-auto/design-engine";
import type { ContentScript, DesignProfile } from "@content-auto/shared";
import { JsonJobStore } from "@content-auto/storage";
import {
  canTransition,
  generateDesignJob,
  updateJobStatus,
} from "@content-auto/workflows";

const script: ContentScript = {
  id: "happy-content",
  title: "Happy Path",
  brand: "TestCo",
  language: "en",
  sections: [
    { id: "h", role: "headline", text: "Ship it", order: 1 },
    { id: "b", role: "body", text: "End-to-end generation works.", order: 2 },
    { id: "c", role: "cta", text: "Go", order: 3 },
  ],
};

const profile: DesignProfile = {
  id: "happy-profile",
  name: "Happy Profile",
  canvas: { width: 800, height: 1000, unit: "px" },
  colors: {
    background: "#0A0A0A",
    primary: "#4ADE80",
    secondary: "#94A3B8",
    text: "#F8FAFC",
    accent: "#FBBF24",
  },
  typography: {
    headline: { fontFamily: "Inter", fontSize: 40, fontWeight: 700, lineHeight: 1.15 },
    subhead: { fontFamily: "Inter", fontSize: 20, fontWeight: 500, lineHeight: 1.3 },
    body: { fontFamily: "Inter", fontSize: 16, fontWeight: 400, lineHeight: 1.45 },
    cta: { fontFamily: "Inter", fontSize: 16, fontWeight: 600, lineHeight: 1.2 },
  },
  layout: { padding: 40, gap: 20, columns: 1 },
};

describe("generate design happy path", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "content-auto-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("normalizes → generates validated spec → advances review status", async () => {
    const normalized = normalizeContent(script);
    expect(normalized.headline).toBe("Ship it");

    const store = new JsonJobStore(dir);
    const job = await generateDesignJob(
      {
        contentProvider: new LocalJsonContentProvider([script]),
        profileProvider: new LocalJsonProfileProvider([profile]),
        ai: new MockAiDesignProvider(),
        store,
      },
      { contentId: script.id, profileId: profile.id },
    );

    expect(job.status).toBe("generated");
    expect(job.designSpec).toBeDefined();
    const validation = validateDesignSpec(job.designSpec);
    expect(validation.valid).toBe(true);

    expect(canTransition("generated", "in_review")).toBe(true);
    const reviewed = await updateJobStatus(store, job.id, "in_review");
    expect(reviewed.status).toBe("in_review");

    const approved = await updateJobStatus(store, job.id, "approved", "Looks good");
    expect(approved.status).toBe("approved");
    expect(approved.reviewNotes).toBe("Looks good");

    const exported = await updateJobStatus(store, job.id, "exported");
    expect(exported.status).toBe("exported");

    const loaded = await store.get(job.id);
    expect(loaded?.status).toBe("exported");
  });

  it("rejects marking draft as generated without a design spec", async () => {
    const store = new JsonJobStore(dir);
    const now = new Date().toISOString();
    await store.save({
      id: "no-spec-job",
      status: "draft",
      contentId: script.id,
      profileId: profile.id,
      title: "No Spec",
      createdAt: now,
      updatedAt: now,
    });

    await expect(updateJobStatus(store, "no-spec-job", "generated")).rejects.toThrow(
      /without a design spec/,
    );
  });
});
