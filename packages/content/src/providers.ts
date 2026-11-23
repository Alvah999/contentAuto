import type { ContentScript } from "@content-auto/shared";

/** Content source adapter — real Google Sheets/Docs wired later */
export interface ContentProvider {
  readonly id: string;
  readonly name: string;
  listScripts(): Promise<ContentScript[]>;
  getScript(id: string): Promise<ContentScript | null>;
}

export class LocalJsonContentProvider implements ContentProvider {
  readonly id = "local-json";
  readonly name = "Local JSON Samples";

  constructor(private readonly scripts: ContentScript[]) {}

  async listScripts(): Promise<ContentScript[]> {
    return [...this.scripts];
  }

  async getScript(id: string): Promise<ContentScript | null> {
    return this.scripts.find((s) => s.id === id) ?? null;
  }
}

/** Stub for future Google Sheets integration */
export class GoogleSheetsContentProvider implements ContentProvider {
  readonly id = "google-sheets";
  readonly name = "Google Sheets (stub)";

  constructor(private readonly credentialsPresent: boolean) {}

  async listScripts(): Promise<ContentScript[]> {
    if (!this.credentialsPresent) {
      throw new Error(
        "Google Sheets credentials missing. Set GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_SHEETS_ID, or use local-json provider.",
      );
    }
    throw new Error("Google Sheets provider not implemented in Phase 1 — use local-json.");
  }

  async getScript(_id: string): Promise<ContentScript | null> {
    if (!this.credentialsPresent) {
      throw new Error("Google Sheets credentials missing.");
    }
    throw new Error("Google Sheets provider not implemented in Phase 1.");
  }
}

/** Stub for future Google Docs integration */
export class GoogleDocsContentProvider implements ContentProvider {
  readonly id = "google-docs";
  readonly name = "Google Docs (stub)";

  constructor(private readonly credentialsPresent: boolean) {}

  async listScripts(): Promise<ContentScript[]> {
    if (!this.credentialsPresent) {
      throw new Error(
        "Google Docs credentials missing. Set GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_DOCS_ID, or use local-json provider.",
      );
    }
    throw new Error("Google Docs provider not implemented in Phase 1 — use local-json.");
  }

  async getScript(_id: string): Promise<ContentScript | null> {
    if (!this.credentialsPresent) {
      throw new Error("Google Docs credentials missing.");
    }
    throw new Error("Google Docs provider not implemented in Phase 1.");
  }
}
