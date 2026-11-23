import type { Job, JobStatus } from "@content-auto/shared";
import type { JobStore } from "@content-auto/storage";
import { assertTransition } from "./status.js";

export async function updateJobStatus(
  store: JobStore,
  jobId: string,
  status: JobStatus,
  reviewNotes?: string,
): Promise<Job> {
  const job = await store.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  assertTransition(job.status, status);

  const updated: Job = {
    ...job,
    status,
    reviewNotes: reviewNotes ?? job.reviewNotes,
    updatedAt: new Date().toISOString(),
  };
  await store.save(updated);
  return updated;
}
