import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { JsonJobStore } from "@content-auto/storage";
import type { Job } from "@content-auto/shared";

describe("JsonJobStore id safety", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "content-auto-store-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("rejects path traversal job ids", async () => {
    const store = new JsonJobStore(dir);
    await expect(store.get("../etc/passwd")).rejects.toThrow(/Invalid job id/);
    await expect(store.get("../../secrets")).rejects.toThrow(/Invalid job id/);
    await expect(
      store.save({
        id: "../escape",
        status: "draft",
        contentId: "c",
        profileId: "p",
        title: "bad",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Job),
    ).rejects.toThrow(/Invalid job id/);
  });

  it("accepts uuid-like ids", async () => {
    const store = new JsonJobStore(dir);
    const job: Job = {
      id: "847ec51a-66db-4d09-9a18-caac71cc9b91",
      status: "draft",
      contentId: "c",
      profileId: "p",
      title: "ok",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await store.save(job);
    const loaded = await store.get(job.id);
    expect(loaded?.title).toBe("ok");
  });
});
