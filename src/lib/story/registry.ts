/**
 * Story options the code knows how to render. The admin only picks from
 * these lists — it never writes animation, shader or GSAP configuration.
 */

export const STORY_VISUAL_TYPES = ["record", "record-spin", "map", "scale", "signal", "photo"] as const;

export type StoryVisualType = (typeof STORY_VISUAL_TYPES)[number];

export const STORY_VISUAL_LABELS: Record<StoryVisualType, string> = {
  record: "Disco parado",
  "record-spin": "Disco girando",
  map: "Mapa",
  scale: "Frase em destaque (escala)",
  signal: "Sinal ao vivo (equalizador)",
  photo: "Fotografia",
};

export function isStoryVisualType(value: unknown): value is StoryVisualType {
  return typeof value === "string" && (STORY_VISUAL_TYPES as readonly string[]).includes(value);
}

export const LABEL_POSITIONS = ["right", "left", "above", "below"] as const;

export type LabelPosition = (typeof LABEL_POSITIONS)[number];

export const LABEL_POSITION_LABELS: Record<LabelPosition, string> = {
  right: "À direita",
  left: "À esquerda",
  above: "Acima",
  below: "Abaixo",
};

export function isLabelPosition(value: unknown): value is LabelPosition {
  return typeof value === "string" && (LABEL_POSITIONS as readonly string[]).includes(value);
}

/** Safe numeric ranges — outside them the map/globe framing breaks. */
export const STORY_LIMITS = {
  latitude: { min: -90, max: 90 },
  longitude: { min: -180, max: 180 },
  /** Map camera width in degrees: ~a city (2°) up to the whole world (180°). */
  cameraWidthDeg: { min: 2, max: 180 },
  scrollWeight: { min: 0.6, max: 1.6 },
  narrativeVhPerLine: { min: 70, max: 130 },
  /** Chapters beyond this make the pinned scroll unwieldy. */
  maxPublishedChapters: 20,
} as const;

export const STORY_PLACE_ROLE_LABELS = {
  CAMERA: "Enquadramento da câmera",
  LABEL: "Rótulo no mapa",
  PULSE: "Ponto pulsante",
  ROUTE_FROM: "Rota — origem",
  ROUTE_TO: "Rota — destino",
} as const;
