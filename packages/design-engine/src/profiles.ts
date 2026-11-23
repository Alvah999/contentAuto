import type { DesignProfile } from "@content-auto/shared";

export interface DesignProfileProvider {
  listProfiles(): Promise<DesignProfile[]>;
  getProfile(id: string): Promise<DesignProfile | null>;
}

export class LocalJsonProfileProvider implements DesignProfileProvider {
  constructor(private readonly profiles: DesignProfile[]) {}

  async listProfiles(): Promise<DesignProfile[]> {
    return [...this.profiles];
  }

  async getProfile(id: string): Promise<DesignProfile | null> {
    return this.profiles.find((p) => p.id === id) ?? null;
  }
}
