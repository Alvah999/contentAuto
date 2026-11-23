import type { DesignProfile, DesignSpec, NormalizedContent } from "@content-auto/shared";
import { MockAiDesignProvider } from "./mock.js";
import { OpenAiDesignProvider } from "./openai.js";

export interface AiDesignProvider {
  readonly id: string;
  readonly mode: "live" | "mock";
  generateDesignSpec(input: {
    content: NormalizedContent;
    profile: DesignProfile;
    jobId: string;
    title?: string;
  }): Promise<DesignSpec>;
}

export function createAiProvider(apiKey?: string, model?: string): AiDesignProvider {
  if (apiKey && apiKey.trim()) {
    return new OpenAiDesignProvider(apiKey.trim(), model ?? "gpt-4o-mini");
  }
  return new MockAiDesignProvider();
}
