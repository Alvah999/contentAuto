/** Job lifecycle for Phase 1 review workflow */
export type JobStatus =
  | "draft"
  | "generated"
  | "in_review"
  | "approved"
  | "revision_requested"
  | "rejected"
  | "exported";

export const JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ["generated"],
  generated: ["in_review", "draft"],
  in_review: ["approved", "revision_requested", "rejected"],
  approved: ["exported"],
  revision_requested: ["draft", "generated"],
  rejected: [],
  exported: [],
};

export interface ContentScript {
  id: string;
  title: string;
  brand?: string;
  channel?: string;
  language?: string;
  sections: ContentSection[];
  metadata?: Record<string, string>;
}

export interface ContentSection {
  id: string;
  role: "headline" | "subhead" | "body" | "cta" | "caption" | "bullet" | "other";
  text: string;
  order: number;
}

export interface NormalizedContent {
  sourceId: string;
  title: string;
  brand?: string;
  channel?: string;
  language: string;
  headline?: string;
  subhead?: string;
  body: string[];
  cta?: string;
  bullets: string[];
  caption?: string;
  wordCount: number;
  sectionCount: number;
}

export interface DesignProfile {
  id: string;
  name: string;
  description?: string;
  canvas: {
    width: number;
    height: number;
    unit: "px";
  };
  colors: {
    background: string;
    primary: string;
    secondary: string;
    text: string;
    accent?: string;
  };
  typography: {
    headline: TypeStyle;
    subhead: TypeStyle;
    body: TypeStyle;
    cta: TypeStyle;
  };
  layout: {
    padding: number;
    gap: number;
    columns: number;
  };
  referenceNote?: string;
}

export interface TypeStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing?: number;
}

export type LayerType = "FRAME" | "RECTANGLE" | "TEXT" | "ELLIPSE" | "LINE";

export interface DesignLayer {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  fills?: Fill[];
  strokes?: Stroke[];
  cornerRadius?: number;
  text?: TextProps;
  children?: DesignLayer[];
}

export interface Fill {
  type: "SOLID";
  color: string;
  opacity?: number;
}

export interface Stroke {
  type: "SOLID";
  color: string;
  weight: number;
}

export interface TextProps {
  characters: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing?: number;
  color: string;
  textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT";
  textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
}

export interface DesignSpec {
  version: "1.0";
  id: string;
  name: string;
  profileId: string;
  contentId: string;
  canvas: {
    width: number;
    height: number;
  };
  root: DesignLayer;
  createdAt: string;
  notes?: string[];
}

export interface Job {
  id: string;
  status: JobStatus;
  contentId: string;
  profileId: string;
  title: string;
  normalizedContent?: NormalizedContent;
  designSpec?: DesignSpec;
  reviewNotes?: string;
  figmaFileKey?: string;
  figmaNodeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateDesignRequest {
  contentId: string;
  profileId: string;
  title?: string;
}

export interface UpdateJobStatusRequest {
  status: JobStatus;
  reviewNotes?: string;
}
