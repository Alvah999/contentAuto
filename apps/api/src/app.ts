import express from "express";
import cors from "cors";
import { createAiProvider } from "@content-auto/ai";
import {
  GoogleDocsContentProvider,
  GoogleSheetsContentProvider,
  LocalJsonContentProvider,
} from "@content-auto/content";
import {
  createFigmaAdapter,
  LocalJsonProfileProvider,
} from "@content-auto/design-engine";
import {
  generateDesignRequestSchema,
  updateJobStatusRequestSchema,
} from "@content-auto/shared";
import {
  JsonJobStore,
  loadContentScripts,
  loadDesignProfiles,
} from "@content-auto/storage";
import { generateDesignJob, updateJobStatus } from "@content-auto/workflows";
import path from "node:path";
import { config } from "./config.js";

export async function createApp() {
  const scripts = await loadContentScripts(config.samplesDir);
  const profiles = await loadDesignProfiles(config.samplesDir);

  const contentProvider = new LocalJsonContentProvider(scripts);
  const profileProvider = new LocalJsonProfileProvider(profiles);
  const ai = createAiProvider(config.openaiApiKey, config.openaiModel);
  const store = new JsonJobStore(path.join(config.dataDir, "jobs"));
  const figma = createFigmaAdapter(config.figmaAccessToken);
  const sheetsStub = new GoogleSheetsContentProvider(Boolean(config.googleServiceAccountJson));
  const docsStub = new GoogleDocsContentProvider(Boolean(config.googleServiceAccountJson));

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      aiMode: ai.mode,
      figmaMode: figma.mode,
      contentScripts: scripts.length,
      designProfiles: profiles.length,
    });
  });

  app.get("/api/content", async (_req, res, next) => {
    try {
      const list = await contentProvider.listScripts();
      res.json({ provider: contentProvider.id, items: list });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/content/:id", async (req, res, next) => {
    try {
      const item = await contentProvider.getScript(req.params.id);
      if (!item) {
        res.status(404).json({ error: "Content not found" });
        return;
      }
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/profiles", async (_req, res, next) => {
    try {
      const list = await profileProvider.listProfiles();
      res.json({ items: list });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/profiles/:id", async (req, res, next) => {
    try {
      const item = await profileProvider.getProfile(req.params.id);
      if (!item) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/generate", async (req, res, next) => {
    try {
      const parsed = generateDesignRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }
      const job = await generateDesignJob(
        { contentProvider, profileProvider, ai, store },
        parsed.data,
      );
      res.status(201).json(job);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/jobs", async (_req, res, next) => {
    try {
      const jobs = await store.list();
      res.json({ items: jobs });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/jobs/:id", async (req, res, next) => {
    try {
      const job = await store.get(req.params.id);
      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      res.json(job);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/jobs/:id/spec", async (req, res, next) => {
    try {
      const job = await store.get(req.params.id);
      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }
      if (!job.designSpec) {
        res.status(404).json({ error: "Design spec not generated yet" });
        return;
      }
      res.json(job.designSpec);
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/jobs/:id/status", async (req, res, next) => {
    try {
      const parsed = updateJobStatusRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
      }
      const job = await updateJobStatus(
        store,
        req.params.id,
        parsed.data.status,
        parsed.data.reviewNotes,
      );
      res.json(job);
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/integrations", (_req, res) => {
    res.json({
      ai: { id: ai.id, mode: ai.mode },
      figma: { mode: figma.mode },
      content: {
        active: contentProvider.id,
        stubs: [
          { id: sheetsStub.id, available: Boolean(config.googleServiceAccountJson) },
          { id: docsStub.id, available: Boolean(config.googleServiceAccountJson) },
        ],
      },
    });
  });

  app.get("/api/figma/meta/:fileKey", async (req, res, next) => {
    try {
      const meta = await figma.getFileMeta(req.params.fileKey);
      res.json(meta);
    } catch (err) {
      next(err);
    }
  });

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      const status = message.includes("not found")
        ? 404
        : message.includes("Invalid status") ||
            message.includes("Invalid job id") ||
            message.includes("Cannot mark job as generated")
          ? 400
          : 500;
      res.status(status).json({ error: message });
    },
  );

  return app;
}
