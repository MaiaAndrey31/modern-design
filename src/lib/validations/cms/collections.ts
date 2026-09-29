import { z } from "zod";
import { optionalHttpsUrl, optionalMediaId, optionalText, ptText, requiredMediaId } from "./common";

const status = z.enum(["DRAFT", "PUBLISHED"]);

export const worldStageSchema = z.object({
  yearLabel: z.string().trim().min(1, "Informe o ano.").max(16),
  titlePt: ptText(80, "Título"),
  titleEn: optionalText(80),
  locationPt: ptText(80, "Local"),
  locationEn: optionalText(80),
  descriptionPt: ptText(600, "Descrição"),
  descriptionEn: optionalText(600),
  imageId: optionalMediaId,
  videoId: optionalMediaId,
  showInNumbers: z.boolean(),
  status,
});
export type WorldStageInput = z.infer<typeof worldStageSchema>;

export const experienceFrameSchema = z.object({
  slot: z.coerce.number().int().min(1).max(4),
  layout: z.enum(["WIDE", "TALL"]),
  offsetPx: z.coerce.number().int().min(-120).max(120),
  mediaId: optionalMediaId,
  altPt: ptText(200, "Texto alternativo"),
  altEn: optionalText(200),
  status,
});
export type ExperienceFrameInput = z.infer<typeof experienceFrameSchema>;

export const releaseSchema = z
  .object({
    title: z.string().trim().min(1, "Informe o título.").max(120),
    yearLabel: z.string().trim().min(1, "Informe o ano.").max(16),
    type: z.enum(["SINGLE", "EP", "ALBUM", "REMIX"]),
    coverId: optionalMediaId,
    spotifyUrl: optionalHttpsUrl,
    appleMusicUrl: optionalHttpsUrl,
    youtubeUrl: optionalHttpsUrl,
    soundcloudUrl: optionalHttpsUrl,
    status,
  })
  .superRefine((value, ctx) => {
    if (value.status === "PUBLISHED" && !value.coverId) {
      ctx.addIssue({ code: "custom", path: ["coverId"], message: "Um lançamento publicado precisa de capa." });
    }
  });
export type ReleaseInput = z.infer<typeof releaseSchema>;

export const showSchema = z.object({
  title: optionalText(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."),
  time: z
    .union([z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida (HH:MM)."), z.literal(""), z.null()]).optional()
    .transform((v) => (v ? v : null)),
  city: z.string().trim().min(1, "Informe a cidade.").max(80),
  state: optionalText(40),
  country: optionalText(60),
  venue: z.string().trim().min(1, "Informe o local.").max(120),
  address: optionalText(200),
  ticketUrl: optionalHttpsUrl,
  soldOut: z.boolean(),
  featured: z.boolean(),
  showStatus: z.enum(["SCHEDULED", "CANCELLED", "POSTPONED", "RESCHEDULED"]),
  imageId: optionalMediaId,
  internalNotes: optionalText(2000),
  status,
});
export type ShowInput = z.infer<typeof showSchema>;

export const galleryItemSchema = z.object({
  mediaId: requiredMediaId,
  altPt: ptText(200, "Texto alternativo"),
  altEn: optionalText(200),
  captionPt: optionalText(200),
  captionEn: optionalText(200),
  orientation: z.enum(["PORTRAIT", "LANDSCAPE", "SQUARE"]),
  status,
});
export type GalleryItemInput = z.infer<typeof galleryItemSchema>;

export const pressItemSchema = z.object({
  outlet: z.string().trim().min(1, "Informe o veículo.").max(80),
  title: z.string().trim().min(1, "Informe a manchete.").max(200),
  dateLabel: z.string().trim().min(1, "Informe a data.").max(40),
  publishedAt: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida."), z.literal(""), z.null()]).optional()
    .transform((v) => (v ? v : null)),
  url: optionalHttpsUrl,
  excerptPt: optionalText(600),
  excerptEn: optionalText(600),
  logoId: optionalMediaId,
  status,
});
export type PressItemInput = z.infer<typeof pressItemSchema>;
