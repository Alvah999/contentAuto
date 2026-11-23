import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { ContentScript, DesignProfile } from "@content-auto/shared";

export async function loadContentScripts(samplesDir: string): Promise<ContentScript[]> {
  const dir = path.join(samplesDir, "content");
  const files = await readdir(dir);
  const scripts: ContentScript[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await readFile(path.join(dir, file), "utf8");
    scripts.push(JSON.parse(raw) as ContentScript);
  }
  return scripts;
}

export async function loadDesignProfiles(samplesDir: string): Promise<DesignProfile[]> {
  const dir = path.join(samplesDir, "design-profiles");
  const files = await readdir(dir);
  const profiles: DesignProfile[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const raw = await readFile(path.join(dir, file), "utf8");
    profiles.push(JSON.parse(raw) as DesignProfile);
  }
  return profiles;
}
