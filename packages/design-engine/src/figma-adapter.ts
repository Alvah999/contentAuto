/**
 * Figma REST adapter — read-only metadata in Phase 1.
 * Never overwrites reference templates.
 */
export interface FigmaFileMeta {
  key: string;
  name: string;
  lastModified?: string;
  thumbnailUrl?: string;
}

export interface FigmaAdapter {
  readonly mode: "live" | "mock";
  getFileMeta(fileKey: string): Promise<FigmaFileMeta>;
  /** Explicitly blocked — references must never be overwritten */
  overwriteReference(_fileKey: string): never;
}

export class MockFigmaAdapter implements FigmaAdapter {
  readonly mode = "mock" as const;

  async getFileMeta(fileKey: string): Promise<FigmaFileMeta> {
    return {
      key: fileKey,
      name: `[mock] Reference ${fileKey}`,
      lastModified: new Date().toISOString(),
      thumbnailUrl: undefined,
    };
  }

  overwriteReference(_fileKey: string): never {
    throw new Error(
      "Refusing to overwrite reference templates. Create a new file/frame via the plugin instead.",
    );
  }
}

export class RestFigmaAdapter implements FigmaAdapter {
  readonly mode = "live" as const;

  constructor(private readonly accessToken: string) {}

  async getFileMeta(fileKey: string): Promise<FigmaFileMeta> {
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=1`, {
      headers: { "X-Figma-Token": this.accessToken },
    });
    if (!res.ok) {
      throw new Error(`Figma API error ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      name: string;
      lastModified?: string;
      thumbnailUrl?: string;
    };
    return {
      key: fileKey,
      name: data.name,
      lastModified: data.lastModified,
      thumbnailUrl: data.thumbnailUrl,
    };
  }

  overwriteReference(_fileKey: string): never {
    throw new Error(
      "Refusing to overwrite reference templates. Create a new file/frame via the plugin instead.",
    );
  }
}

export function createFigmaAdapter(token?: string): FigmaAdapter {
  if (token && token.trim()) {
    return new RestFigmaAdapter(token.trim());
  }
  return new MockFigmaAdapter();
}
