import { randomUUID } from "node:crypto";
import type { AiDesignProvider } from "@content-auto/ai";
import { normalizeContent, type ContentProvider } from "@content-auto/content";
import {
  validateDesignSpec,
  type DesignProfileProvider,
} from "@content-auto/design-engine";
import type { Job } from "@content-auto/shared";
import type { JobStore } from "@content-auto/storage";

export interface GenerateDesignDeps {
  contentProvider: ContentProvider;
  profileProvider: DesignProfileProvider;
  ai: AiDesignProvider;
  store: JobStore;
}

export async function generateDesignJob(
  deps: GenerateDesignDeps,
  input: { contentId: string; profileId: string; title?: string },
): Promise<Job> {
  const script = await deps.contentProvider.getScript(input.contentId);
  if (!script) {
    throw new Error(`Content script not found: ${input.contentId}`);
  }

  const profile = await deps.profileProvider.getProfile(input.profileId);
  if (!profile) {
    throw new Error(`Design profile not found: ${input.profileId}`);
  }

  const now = new Date().toISOString();
  const jobId = randomUUID();
  const normalized = normalizeContent(script);

  const draft: Job = {
    id: jobId,
    status: "draft",
    contentId: input.contentId,
    profileId: input.profileId,
    title: input.title ?? script.title,
    normalizedContent: normalized,
    createdAt: now,
    updatedAt: now,
  };
  await deps.store.save(draft);

  const rawSpec = await deps.ai.generateDesignSpec({
    content: normalized,
    profile,
    jobId,
    title: draft.title,
  });

  const validation = validateDesignSpec(rawSpec);
  if (!validation.valid || !validation.data) {
    throw new Error(
      `Design spec failed schema validation: ${validation.errors?.join("; ")}`,
    );
  }

  const generated: Job = {
    ...draft,
    status: "generated",
    designSpec: validation.data,
    updatedAt: new Date().toISOString(),
  };
  await deps.store.save(generated);
  return generated;
}
