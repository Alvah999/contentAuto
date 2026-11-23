import { useEffect, useState } from "react";
import {
  JOB_STATUS_TRANSITIONS,
  type ContentScript,
  type DesignProfile,
  type Job,
  type JobStatus,
} from "@content-auto/shared";
import {
  fetchContent,
  fetchHealth,
  fetchJobs,
  fetchProfiles,
  generateDesign,
  updateStatus,
} from "./api";
import { SpecPreview } from "./SpecPreview";

const REVIEW_ACTIONS: Array<{ status: JobStatus; label: string; className?: string }> = [
  { status: "in_review", label: "Send to review" },
  { status: "approved", label: "Approve" },
  { status: "revision_requested", label: "Request revision", className: "danger" },
  { status: "rejected", label: "Reject", className: "danger" },
  { status: "exported", label: "Mark exported" },
  { status: "generated", label: "Back to generated" },
  { status: "draft", label: "Reset to draft" },
];

export function App() {
  const [content, setContent] = useState<ContentScript[]>([]);
  const [profiles, setProfiles] = useState<DesignProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contentId, setContentId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<{ aiMode: string; figmaMode: string } | null>(
    null,
  );

  const selected = jobs.find((j) => j.id === selectedId) ?? null;

  const availableActions = selected
    ? REVIEW_ACTIONS.filter((action) => {
        if (!JOB_STATUS_TRANSITIONS[selected.status].includes(action.status)) {
          return false;
        }
        // Never offer "generated" without an existing design spec
        if (action.status === "generated" && !selected.designSpec) {
          return false;
        }
        return true;
      })
    : [];

  async function refresh() {
    const [c, p, j, h] = await Promise.all([
      fetchContent(),
      fetchProfiles(),
      fetchJobs(),
      fetchHealth(),
    ]);
    setContent(c.items);
    setProfiles(p.items);
    setJobs(j.items);
    setHealth({ aiMode: h.aiMode, figmaMode: h.figmaMode });
    if (!contentId && c.items[0]) setContentId(c.items[0].id);
    if (!profileId && p.items[0]) setProfileId(p.items[0].id);
  }

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, []);

  function selectJob(job: Job) {
    setSelectedId(job.id);
    setNotes(job.reviewNotes ?? "");
    setError(null);
  }

  async function onGenerate() {
    setBusy(true);
    setError(null);
    try {
      const job = await generateDesign(contentId, profileId);
      await refresh();
      selectJob(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setBusy(false);
    }
  }

  async function onStatus(status: JobStatus) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const job = await updateStatus(selected.id, status, notes || undefined);
      await refresh();
      selectJob(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusy(false);
    }
  }

  function downloadSpec() {
    if (!selected?.designSpec) return;
    const blob = new Blob([JSON.stringify(selected.designSpec, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.designSpec.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1 className="brand">
            content<span>Auto</span>
          </h1>
          <p className="subtitle">
            Sample content → AI design spec → local review. Import the exported
            spec into the Figma plugin to create editable layers.
          </p>
        </div>
        <div className="badges">
          <span className={`badge ${health?.aiMode === "live" ? "live" : ""}`}>
            AI: {health?.aiMode ?? "…"}
          </span>
          <span className={`badge ${health?.figmaMode === "live" ? "live" : ""}`}>
            Figma REST: {health?.figmaMode ?? "…"}
          </span>
        </div>
      </header>

      {error ? <div className="error">{error}</div> : null}

      <div className="layout">
        <aside className="panel">
          <h2>Generate</h2>
          <div className="field">
            <label htmlFor="content">Content script</label>
            <select
              id="content"
              value={contentId}
              onChange={(e) => setContentId(e.target.value)}
            >
              {content.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="profile">Design profile</label>
            <select
              id="profile"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="actions">
            <button className="primary" disabled={busy || !contentId || !profileId} onClick={onGenerate}>
              {busy ? "Working…" : "Generate design"}
            </button>
          </div>

          <h2 style={{ marginTop: "1.5rem" }}>Jobs</h2>
          {jobs.length === 0 ? (
            <p className="empty">No jobs yet. Generate one to start the review flow.</p>
          ) : (
            <ul className="job-list">
              {jobs.map((job) => (
                <li key={job.id}>
                  <button
                    className={`job-item ${selectedId === job.id ? "active" : ""}`}
                    onClick={() => selectJob(job)}
                  >
                    <span className="title">{job.title}</span>
                    <span className={`status ${job.status}`}>{job.status}</span>
                    <span className="meta">{new Date(job.updatedAt).toLocaleString()}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="panel">
          {!selected ? (
            <p className="empty">Select a job to preview the design spec and update status.</p>
          ) : (
            <>
              <div className="detail-header">
                <div>
                  <h3>{selected.title}</h3>
                  <span className={`status ${selected.status}`}>{selected.status}</span>
                </div>
                <div className="actions">
                  <button disabled={!selected.designSpec} onClick={downloadSpec}>
                    Download spec JSON
                  </button>
                </div>
              </div>

              <div className="field">
                <label htmlFor="notes">Review notes</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional feedback for revision…"
                />
              </div>

              <div className="actions">
                {availableActions.length === 0 ? (
                  <span className="empty">No further transitions from {selected.status}.</span>
                ) : (
                  availableActions.map((action) => (
                    <button
                      key={action.status}
                      className={action.className}
                      disabled={busy}
                      onClick={() => onStatus(action.status)}
                    >
                      {action.label}
                    </button>
                  ))
                )}
              </div>

              {selected.normalizedContent ? (
                <div className="layer-tree" style={{ marginTop: "1rem" }}>
                  <strong style={{ color: "var(--text)" }}>Normalized content</strong>
                  <ul>
                    <li>Words: {selected.normalizedContent.wordCount}</li>
                    <li>Headline: {selected.normalizedContent.headline ?? "—"}</li>
                    <li>CTA: {selected.normalizedContent.cta ?? "—"}</li>
                  </ul>
                </div>
              ) : null}

              {selected.designSpec ? <SpecPreview spec={selected.designSpec} /> : null}

              {selected.designSpec ? (
                <pre className="json-block">
                  {JSON.stringify(selected.designSpec, null, 2)}
                </pre>
              ) : null}

              {selected.reviewNotes ? (
                <p className="layer-tree">Notes: {selected.reviewNotes}</p>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
