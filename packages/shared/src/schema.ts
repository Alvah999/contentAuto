import { z } from "zod";

export const fillSchema = z.object({
  type: z.literal("SOLID"),
  color: z.string().min(1),
  opacity: z.number().min(0).max(1).optional(),
});

export const strokeSchema = z.object({
  type: z.literal("SOLID"),
  color: z.string().min(1),
  weight: z.number().positive(),
});

export const textPropsSchema = z.object({
  characters: z.string(),
  fontFamily: z.string().min(1),
  fontSize: z.number().positive(),
  fontWeight: z.number().int().positive(),
  lineHeight: z.number().positive(),
  letterSpacing: z.number().optional(),
  color: z.string().min(1),
  textAlignHorizontal: z.enum(["LEFT", "CENTER", "RIGHT"]).optional(),
  textAlignVertical: z.enum(["TOP", "CENTER", "BOTTOM"]).optional(),
});

export const designLayerSchema: z.ZodType<import("./types.js").DesignLayer> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(["FRAME", "RECTANGLE", "TEXT", "ELLIPSE", "LINE"]),
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    fills: z.array(fillSchema).optional(),
    strokes: z.array(strokeSchema).optional(),
    cornerRadius: z.number().min(0).optional(),
    text: textPropsSchema.optional(),
    children: z.array(designLayerSchema).optional(),
  }),
);

export const designSpecSchema = z.object({
  version: z.literal("1.0"),
  id: z.string().min(1),
  name: z.string().min(1),
  profileId: z.string().min(1),
  contentId: z.string().min(1),
  canvas: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  root: designLayerSchema,
  createdAt: z.string().min(1),
  notes: z.array(z.string()).optional(),
});

export const jobStatusSchema = z.enum([
  "draft",
  "generated",
  "in_review",
  "approved",
  "revision_requested",
  "rejected",
  "exported",
]);

export const generateDesignRequestSchema = z.object({
  contentId: z.string().min(1),
  profileId: z.string().min(1),
  title: z.string().optional(),
});

export const updateJobStatusRequestSchema = z.object({
  status: jobStatusSchema,
  reviewNotes: z.string().optional(),
});

export type DesignSpecInput = z.infer<typeof designSpecSchema>;
