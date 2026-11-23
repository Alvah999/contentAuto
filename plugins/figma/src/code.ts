/// <reference types="@figma/plugin-typings" />

type Fill = { type: "SOLID"; color: string; opacity?: number };
type Stroke = { type: "SOLID"; color: string; weight: number };
type TextProps = {
  characters: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing?: number;
  color: string;
  textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT";
  textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
};

type DesignLayer = {
  id: string;
  name: string;
  type: "FRAME" | "RECTANGLE" | "TEXT" | "ELLIPSE" | "LINE";
  x: number;
  y: number;
  width: number;
  height: number;
  fills?: Fill[];
  strokes?: Stroke[];
  cornerRadius?: number;
  text?: TextProps;
  children?: DesignLayer[];
};

type DesignSpec = {
  version: "1.0";
  id: string;
  name: string;
  canvas: { width: number; height: number };
  root: DesignLayer;
};

figma.showUI(__html__, { width: 420, height: 420, themeColors: true });

figma.ui.onmessage = async (msg: { type: string; spec?: DesignSpec }) => {
  if (msg.type === "close") {
    figma.closePlugin();
    return;
  }

  if (msg.type === "import-spec") {
    try {
      if (!msg.spec || msg.spec.version !== "1.0" || !msg.spec.root) {
        throw new Error("Spec must be DesignSpec v1.0 with a root layer");
      }
      await ensureFonts(msg.spec.root);
      const root = await createLayer(msg.spec.root, null);
      if ("resize" in root) {
        // place near viewport center
        const viewport = figma.viewport.center;
        root.x = viewport.x - msg.spec.canvas.width / 2;
        root.y = viewport.y - msg.spec.canvas.height / 2;
      }
      figma.currentPage.selection = [root];
      figma.viewport.scrollAndZoomIntoView([root]);
      figma.ui.postMessage({
        type: "result",
        ok: true,
        message: `Created editable frame “${root.name}” from ${msg.spec.id}. Reference templates untouched.`,
      });
    } catch (err) {
      figma.ui.postMessage({
        type: "result",
        ok: false,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }
};

function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const num = parseInt(full, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

function toPaint(fill: Fill): SolidPaint {
  return {
    type: "SOLID",
    color: hexToRgb(fill.color),
    opacity: fill.opacity ?? 1,
  };
}

async function ensureFonts(layer: DesignLayer): Promise<void> {
  if (layer.type === "TEXT" && layer.text) {
    const family = layer.text.fontFamily || "Inter";
    const style = weightToStyle(layer.text.fontWeight);
    try {
      await figma.loadFontAsync({ family, style });
    } catch {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    }
  }
  for (const child of layer.children ?? []) {
    await ensureFonts(child);
  }
}

function weightToStyle(weight: number): string {
  if (weight >= 700) return "Bold";
  if (weight >= 600) return "Semi Bold";
  if (weight >= 500) return "Medium";
  return "Regular";
}

async function createLayer(
  layer: DesignLayer,
  parent: BaseNode & ChildrenMixin | null,
): Promise<SceneNode> {
  let node: SceneNode;

  switch (layer.type) {
    case "FRAME": {
      const frame = figma.createFrame();
      frame.name = layer.name;
      frame.resize(layer.width, layer.height);
      frame.x = layer.x;
      frame.y = layer.y;
      frame.fills = (layer.fills ?? []).map(toPaint);
      if (layer.cornerRadius != null) frame.cornerRadius = layer.cornerRadius;
      node = frame;
      break;
    }
    case "RECTANGLE": {
      const rect = figma.createRectangle();
      rect.name = layer.name;
      rect.resize(layer.width, layer.height);
      rect.x = layer.x;
      rect.y = layer.y;
      rect.fills = (layer.fills ?? []).map(toPaint);
      if (layer.cornerRadius != null) rect.cornerRadius = layer.cornerRadius;
      if (layer.strokes?.length) {
        rect.strokes = layer.strokes.map(toPaint);
        rect.strokeWeight = layer.strokes[0].weight;
      }
      node = rect;
      break;
    }
    case "ELLIPSE": {
      const ellipse = figma.createEllipse();
      ellipse.name = layer.name;
      ellipse.resize(layer.width, layer.height);
      ellipse.x = layer.x;
      ellipse.y = layer.y;
      ellipse.fills = (layer.fills ?? []).map(toPaint);
      node = ellipse;
      break;
    }
    case "LINE": {
      const line = figma.createLine();
      line.name = layer.name;
      line.x = layer.x;
      line.y = layer.y;
      line.resize(layer.width, 0);
      if (layer.strokes?.length) {
        line.strokes = layer.strokes.map(toPaint);
        line.strokeWeight = layer.strokes[0].weight;
      } else if (layer.fills?.length) {
        line.strokes = layer.fills.map(toPaint);
        line.strokeWeight = 2;
      }
      node = line;
      break;
    }
    case "TEXT": {
      const text = figma.createText();
      text.name = layer.name;
      const family = layer.text?.fontFamily || "Inter";
      const style = weightToStyle(layer.text?.fontWeight ?? 400);
      try {
        await figma.loadFontAsync({ family, style });
        text.fontName = { family, style };
      } catch {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        text.fontName = { family: "Inter", style: "Regular" };
      }
      text.characters = layer.text?.characters ?? "";
      text.fontSize = layer.text?.fontSize ?? 16;
      text.lineHeight = {
        value: (layer.text?.lineHeight ?? 1.2) * (layer.text?.fontSize ?? 16),
        unit: "PIXELS",
      };
      if (layer.text?.letterSpacing != null) {
        text.letterSpacing = { value: layer.text.letterSpacing, unit: "PIXELS" };
      }
      text.fills = [
        {
          type: "SOLID",
          color: hexToRgb(layer.text?.color ?? "#000000"),
        },
      ];
      if (layer.text?.textAlignHorizontal) {
        text.textAlignHorizontal = layer.text.textAlignHorizontal;
      }
      text.x = layer.x;
      text.y = layer.y;
      text.resize(layer.width, layer.height);
      node = text;
      break;
    }
    default:
      throw new Error(`Unsupported layer type: ${(layer as DesignLayer).type}`);
  }

  if (parent && "appendChild" in parent) {
    parent.appendChild(node);
  } else {
    figma.currentPage.appendChild(node);
  }

  if (layer.children?.length && "appendChild" in node) {
    for (const child of layer.children) {
      await createLayer(child, node as BaseNode & ChildrenMixin);
    }
  }

  return node;
}
