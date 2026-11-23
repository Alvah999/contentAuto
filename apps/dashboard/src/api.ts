import type {
  ContentScript,
  DesignProfile,
  DesignSpec,
  Job,
  JobStatus,
} from "@content-auto/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: unknown };
    const message =
      typeof body.error === "string"
        ? body.error
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function fetchContent() {
  return request<{ items: ContentScript[] }>("/api/content");
}

export function fetchProfiles() {
  return request<{ items: DesignProfile[] }>("/api/profiles");
}

export function fetchJobs() {
  return request<{ items: Job[] }>("/api/jobs");
}

export function fetchJob(id: string) {
  return request<Job>(`/api/jobs/${id}`);
}

export function generateDesign(contentId: string, profileId: string, title?: string) {
  return request<Job>("/api/generate", {
    method: "POST",
    body: JSON.stringify({ contentId, profileId, title }),
  });
}

export function updateStatus(jobId: string, status: JobStatus, reviewNotes?: string) {
  return request<Job>(`/api/jobs/${jobId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reviewNotes }),
  });
}

export function fetchHealth() {
  return request<{
    ok: boolean;
    aiMode: string;
    figmaMode: string;
  }>("/health");
}

export type { Job, DesignSpec, ContentScript, DesignProfile, JobStatus };
