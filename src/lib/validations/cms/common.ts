/**
 * Building blocks for the CMS validation schemas (src/lib/validations/cms/*).
 * Every admin mutation parses its input with one of these schemas before
 * touching Prisma; the public site never trusts unvalidated structures.
 */
import { z } from "zod";
import { HEX_COLOR_PATTERN } from "@/lib/theme/registry";
import { NAVIGATION_ITEM_TYPES, validateLinkTarget } from "@/lib/navigation/registry";

/** Required PT copy. */
export const ptText = (max = 300, label = "Campo") =>
  z.string().trim().min(1, `${label}: preencha a versão em português.`).max(max, `${label}: máximo de ${max} caracteres.`);

/** Optional copy (PT or EN): blank → null. */
export const optionalText = (max = 300) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres.`)
    .nullish()
    .transform((v) => (v ? v : null));

/** A list of lines: trims, drops blanks, bounded. */
export const lines = (maxItems = 12, maxLength = 120) =>
  z
    .array(z.string().trim().max(maxLength, `Cada linha pode ter até ${maxLength} caracteres.`))
    .max(maxItems, `No máximo ${maxItems} linhas.`)
    .transform((items) => items.filter(Boolean));

export const hexColor = z
  .string()
  .trim()
  .regex(HEX_COLOR_PATTERN, "Use uma cor no formato #RRGGBB.")
  .transform((v) => v.toUpperCase());

/** https only — used for links rendered on the public site. */
export const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use um link completo começando com https://.");

export const optionalHttpsUrl = z
  .union([httpsUrl, z.literal(""), z.null()]).optional()
  .transform((v) => (v ? v : null));

export const optionalEmail = z
  .union([z.email("E-mail inválido.").trim().max(254), z.literal(""), z.null()]).optional()
  .transform((v) => (v ? v : null));

/** Phone / WhatsApp: digits only (country code included), 8–15 digits. */
export const optionalPhoneDigits = z
  .union([
    z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s()+\-.]/g, ""))
      .pipe(z.string().regex(/^\d{8,15}$/, "Use apenas números, com DDI (8 a 15 dígitos).")),
    z.literal(""),
    z.null(),
  ]).optional()
  .transform((v) => (v ? v : null));

/** A Media row id (cuid) or nothing. Existence is checked by the FK. */
export const optionalMediaId = z
  .union([z.string().trim().regex(/^c[a-z0-9]{20,32}$/i, "Mídia inválida."), z.literal(""), z.null()]).optional()
  .transform((v) => (v ? v : null));

export const requiredMediaId = z.string().trim().regex(/^c[a-z0-9]{20,32}$/i, "Selecione uma mídia.");

export const entityId = z.string().trim().regex(/^c[a-z0-9]{20,32}$/i, "Identificador inválido.");

export const sortOrder = z.coerce.number().int().min(0).max(10_000);

export const navigationItemType = z.enum(NAVIGATION_ITEM_TYPES);

/**
 * An optional link: label PT/EN + type + target. All-empty → null (no link).
 * When a label is given, type and target must be valid for each other.
 */
export const optionalLink = z
  .object({
    labelPt: optionalText(80),
    labelEn: optionalText(80),
    type: navigationItemType.nullish(),
    target: optionalText(2048),
  })
  .superRefine((link, ctx) => {
    if (!link.labelPt && !link.target) return;
    if (!link.labelPt) ctx.addIssue({ code: "custom", path: ["labelPt"], message: "Informe o texto do link em português." });
    if (!link.type) {
      ctx.addIssue({ code: "custom", path: ["type"], message: "Escolha o tipo de link." });
      return;
    }
    const error = validateLinkTarget(link.type, link.target ?? "");
    if (error) ctx.addIssue({ code: "custom", path: ["target"], message: error });
  });

/** A required link (label + valid target). */
export const requiredLink = z
  .object({
    labelPt: ptText(80, "Texto do link"),
    labelEn: optionalText(80),
    type: navigationItemType,
    target: z.string().trim().max(2048),
  })
  .superRefine((link, ctx) => {
    const error = validateLinkTarget(link.type, link.target);
    if (error) ctx.addIssue({ code: "custom", path: ["target"], message: error });
  });
