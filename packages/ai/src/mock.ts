import type {
  DesignLayer,
  DesignProfile,
  DesignSpec,
  NormalizedContent,
  TypeStyle,
} from "@content-auto/shared";
import type { AiDesignProvider } from "./provider.js";

function solid(color: string, opacity = 1) {
  return [{ type: "SOLID" as const, color, opacity }];
}

function textLayer(
  id: string,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  characters: string,
  style: TypeStyle,
  color: string,
  align: "LEFT" | "CENTER" | "RIGHT" = "LEFT",
): DesignLayer {
  return {
    id,
    name,
    type: "TEXT",
    x,
    y,
    width,
    height,
    text: {
      characters,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      color,
      textAlignHorizontal: align,
      textAlignVertical: "TOP",
    },
  };
}

/**
 * Deterministic mock AI that builds a valid design spec from content + profile.
 */
export class MockAiDesignProvider implements AiDesignProvider {
  readonly id = "mock-ai";
  readonly mode = "mock" as const;

  async generateDesignSpec(input: {
    content: NormalizedContent;
    profile: DesignProfile;
    jobId: string;
    title?: string;
  }): Promise<DesignSpec> {
    const { content, profile, jobId, title } = input;
    const { canvas, colors, typography, layout } = profile;
    const pad = layout.padding;
    const gap = layout.gap;
    const contentWidth = canvas.width - pad * 2;

    const children: DesignLayer[] = [];
    let y = pad;

    // Accent bar
    children.push({
      id: `${jobId}-accent`,
      name: "Accent / TopBar",
      type: "RECTANGLE",
      x: 0,
      y: 0,
      width: canvas.width,
      height: 8,
      fills: solid(colors.accent ?? colors.primary),
    });

    // Brand label
    if (content.brand) {
      children.push(
        textLayer(
          `${jobId}-brand`,
          "Text / Brand",
          pad,
          y,
          contentWidth,
          24,
          content.brand.toUpperCase(),
          { ...typography.subhead, fontSize: 12, fontWeight: 600 },
          colors.secondary,
        ),
      );
      y += 28 + gap / 2;
    }

    if (content.headline) {
      const h = Math.ceil(typography.headline.fontSize * typography.headline.lineHeight * 2.2);
      children.push(
        textLayer(
          `${jobId}-headline`,
          "Text / Headline",
          pad,
          y,
          contentWidth,
          h,
          content.headline,
          typography.headline,
          colors.text,
        ),
      );
      y += h + gap;
    }

    if (content.subhead) {
      const h = Math.ceil(typography.subhead.fontSize * typography.subhead.lineHeight * 1.5);
      children.push(
        textLayer(
          `${jobId}-subhead`,
          "Text / Subhead",
          pad,
          y,
          contentWidth,
          h,
          content.subhead,
          typography.subhead,
          colors.secondary,
        ),
      );
      y += h + gap;
    }

    // Decorative shape
    children.push({
      id: `${jobId}-shape`,
      name: "Shape / AccentBlob",
      type: "ELLIPSE",
      x: canvas.width - pad - 72,
      y: pad + 16,
      width: 72,
      height: 72,
      fills: solid(colors.primary, 0.15),
    });

    for (const [i, paragraph] of content.body.entries()) {
      const h = Math.ceil(typography.body.fontSize * typography.body.lineHeight * 3);
      children.push(
        textLayer(
          `${jobId}-body-${i}`,
          `Text / Body ${i + 1}`,
          pad,
          y,
          contentWidth,
          h,
          paragraph,
          typography.body,
          colors.text,
        ),
      );
      y += h + gap / 2;
    }

    for (const [i, bullet] of content.bullets.entries()) {
      const h = Math.ceil(typography.body.fontSize * typography.body.lineHeight);
      children.push(
        textLayer(
          `${jobId}-bullet-${i}`,
          `Text / Bullet ${i + 1}`,
          pad,
          y,
          contentWidth,
          h,
          `• ${bullet}`,
          typography.body,
          colors.text,
        ),
      );
      y += h + 8;
    }

    if (content.cta) {
      y += gap;
      const ctaWidth = Math.min(220, contentWidth);
      const ctaHeight = 48;
      children.push({
        id: `${jobId}-cta-bg`,
        name: "Shape / CTA Button",
        type: "RECTANGLE",
        x: pad,
        y,
        width: ctaWidth,
        height: ctaHeight,
        cornerRadius: 8,
        fills: solid(colors.primary),
      });
      children.push(
        textLayer(
          `${jobId}-cta`,
          "Text / CTA",
          pad,
          y + 12,
          ctaWidth,
          24,
          content.cta,
          typography.cta,
          "#FFFFFF",
          "CENTER",
        ),
      );
      y += ctaHeight + gap;
    }

    if (content.caption) {
      children.push(
        textLayer(
          `${jobId}-caption`,
          "Text / Caption",
          pad,
          canvas.height - pad - 20,
          contentWidth,
          20,
          content.caption,
          { ...typography.body, fontSize: 11 },
          colors.secondary,
        ),
      );
    }

    const root: DesignLayer = {
      id: `${jobId}-root`,
      name: `Frame / ${title ?? content.title}`,
      type: "FRAME",
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      fills: solid(colors.background),
      children,
    };

    return {
      version: "1.0",
      id: `spec-${jobId}`,
      name: title ?? content.title,
      profileId: profile.id,
      contentId: content.sourceId,
      canvas: { width: canvas.width, height: canvas.height },
      root,
      createdAt: new Date().toISOString(),
      notes: [
        "Generated by mock AI provider (no OPENAI_API_KEY).",
        `Profile: ${profile.name}`,
        "Reference templates are never overwritten — import via Figma plugin into a new frame.",
      ],
    };
  }
}
