import type { DesignLayer, DesignSpec } from "@content-auto/shared";

function LayerNode({ layer }: { layer: DesignLayer }) {
  const fill = layer.fills?.[0]?.color ?? "transparent";
  const opacity = layer.fills?.[0]?.opacity ?? 1;
  const style: React.CSSProperties = {
    left: layer.x,
    top: layer.y,
    width: layer.width,
    height: layer.height,
    background:
      layer.type === "TEXT" || layer.type === "FRAME" ? fill : fill,
    opacity,
    borderRadius:
      layer.type === "ELLIPSE"
        ? "50%"
        : layer.cornerRadius
          ? `${layer.cornerRadius}px`
          : undefined,
    border: layer.strokes?.[0]
      ? `${layer.strokes[0].weight}px solid ${layer.strokes[0].color}`
      : undefined,
  };

  if (layer.type === "TEXT" && layer.text) {
    return (
      <div
        className="layer-box layer-text"
        style={{
          ...style,
          background: "transparent",
          opacity: 1,
          color: layer.text.color,
          fontFamily: layer.text.fontFamily,
          fontSize: layer.text.fontSize,
          fontWeight: layer.text.fontWeight,
          lineHeight: layer.text.lineHeight,
          letterSpacing: layer.text.letterSpacing,
          textAlign: layer.text.textAlignHorizontal?.toLowerCase() as
            | "left"
            | "center"
            | "right"
            | undefined,
        }}
        title={layer.name}
      >
        {layer.text.characters}
      </div>
    );
  }

  return (
    <div className="layer-box" style={style} title={layer.name}>
      {layer.children?.map((child) => (
        <LayerNode key={child.id} layer={child} />
      ))}
    </div>
  );
}

function collectNames(layer: DesignLayer, acc: string[] = []): string[] {
  acc.push(`${layer.type} — ${layer.name}`);
  for (const child of layer.children ?? []) collectNames(child, acc);
  return acc;
}

export function SpecPreview({ spec }: { spec: DesignSpec }) {
  const maxPreviewWidth = 520;
  const scale = Math.min(1, maxPreviewWidth / spec.canvas.width);

  return (
    <div className="spec-preview">
      <div className="toolbar">
        <span>
          {spec.name} · {spec.canvas.width}×{spec.canvas.height}
        </span>
        <span>spec {spec.id}</span>
      </div>
      <div className="spec-canvas-wrap">
        <div
          className="spec-canvas"
          style={{
            width: spec.canvas.width,
            height: spec.canvas.height,
            transform: `scale(${scale})`,
            marginBottom: spec.canvas.height * (scale - 1),
          }}
        >
          <LayerNode layer={spec.root} />
        </div>
      </div>
      <div className="layer-tree" style={{ padding: "0 0.85rem 0.85rem" }}>
        <strong style={{ color: "var(--text)" }}>Layers</strong>
        <ul>
          {collectNames(spec.root).map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
