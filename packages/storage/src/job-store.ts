import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Job } from "@content-auto/shared";

export interface JobStore {
  list(): Promise<Job[]>;
  get(id: string): Promise<Job | null>;
  save(job: Job): Promise<Job>;
}

const SAFE_JOB_ID = /^[a-zA-Z0-9_-]+$/;

export class JsonJobStore implements JobStore {
  constructor(private readonly dir: string) {}

  private async ensureDir(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

  /** Reject path traversal and absolute segments in job ids. */
  private assertSafeId(id: string): string {
    if (!id || !SAFE_JOB_ID.test(id)) {
      throw new Error(`Invalid job id: ${id}`);
    }
    return id;
  }

  private filePath(id: string): string {
    const safe = this.assertSafeId(id);
    const root = path.resolve(this.dir);
    const resolved = path.resolve(root, `${safe}.json`);
    if (resolved !== path.join(root, `${safe}.json`)) {
      throw new Error(`Invalid job id path: ${id}`);
    }
    return resolved;
  }

  async list(): Promise<Job[]> {
    await this.ensureDir();
    const files = await readdir(this.dir);
    const jobs: Job[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const raw = await readFile(path.join(this.dir, file), "utf8");
      jobs.push(JSON.parse(raw) as Job);
    }
    return jobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<Job | null> {
    await this.ensureDir();
    try {
      const raw = await readFile(this.filePath(id), "utf8");
      return JSON.parse(raw) as Job;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Invalid job id")) {
        throw err;
      }
      return null;
    }
  }

  async save(job: Job): Promise<Job> {
    await this.ensureDir();
    await writeFile(this.filePath(job.id), JSON.stringify(job, null, 2), "utf8");
    return job;
  }
}
