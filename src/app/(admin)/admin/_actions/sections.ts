"use server";

import { prisma } from "@/lib/db";
import { CONTENT_ROLES, SETTINGS_ROLES, requireRole } from "@/lib/auth/guards";
import { audit } from "@/lib/admin/audit";
import { invalidate } from "@/lib/admin/invalidate";
import { link, text } from "@/lib/admin/formData";
import { failed, invalid, saved } from "@/lib/admin/result";
import { CACHE_TAGS } from "@/lib/content/tags";
import { SECTION_REGISTRY, isSectionKey, type SectionGenericField } from "@/lib/sections/registry";
import { sectionCopySchema, sectionOrderSchema } from "@/lib/validations/cms/sections";
import type { ActionState } from "@/lib/validations/admin/actionState";

/**
 * Generic copy of one section. Only the fields the SECTION_REGISTRY declares
 * for that section are written — anything else in the request is ignored.
 */
export async function updateSectionCopyAction(key: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(CONTENT_ROLES);
  if (!isSectionKey(key)) return failed("Seção desconhecida.");

  const parsed = sectionCopySchema.safeParse({
    eyebrowPt: text(formData, "eyebrowPt"),
    eyebrowEn: text(formData, "eyebrowEn"),
    titlePt: text(formData, "titlePt"),
    titleEn: text(formData, "titleEn"),
    subtitlePt: text(formData, "subtitlePt"),
    subtitleEn: text(formData, "subtitleEn"),
    descriptionPt: text(formData, "descriptionPt"),
    descriptionEn: text(formData, "descriptionEn"),
    emptyTextPt: text(formData, "emptyTextPt"),
    emptyTextEn: text(formData, "emptyTextEn"),
    cta: link(formData, "cta"),
  });
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  const uses = (field: SectionGenericField) => field in SECTION_REGISTRY[key].fields;
  const data = {
    ...(uses("eyebrow") && { eyebrowPt: d.eyebrowPt, eyebrowEn: d.eyebrowEn }),
    ...(uses("title") && { titlePt: d.titlePt, titleEn: d.titleEn }),
    ...(uses("subtitle") && { subtitlePt: d.subtitlePt, subtitleEn: d.subtitleEn }),
    ...(uses("description") && { descriptionPt: d.descriptionPt, descriptionEn: d.descriptionEn }),
    ...(uses("emptyText") && { emptyTextPt: d.emptyTextPt, emptyTextEn: d.emptyTextEn }),
    ...(uses("cta") && {
      ctaLabelPt: d.cta.labelPt,
      ctaLabelEn: d.cta.labelEn,
      ctaType: d.cta.labelPt ? d.cta.type ?? null : null,
      ctaTarget: d.cta.labelPt ? d.cta.target : null,
    }),
  };

  await prisma.section.upsert({
    where: { key },
    create: { key, sortOrder: SECTION_REGISTRY[key].defaultSortOrder, ...data },
    update: data,
  });

  await audit({ userId: user.id, action: "update", entity: "Section", entityId: key, summary: `Textos da seção ${SECTION_REGISTRY[key].label}`, diff: data });
  invalidate(CACHE_TAGS.sections);
  return saved();
}

export async function setSectionEnabledAction(key: string, enabled: boolean): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);
  if (!isSectionKey(key)) return failed("Seção desconhecida.");
  const def = SECTION_REGISTRY[key];
  if (!def.toggleable) return failed(`${def.label} não pode ser desativada.`);

  await prisma.section.upsert({
    where: { key },
    create: { key, enabled, sortOrder: def.defaultSortOrder },
    update: { enabled },
  });

  await audit({ userId: user.id, action: "toggle", entity: "Section", entityId: key, summary: `${def.label} ${enabled ? "ativada" : "desativada"}`, diff: { enabled } });
  // Visibility changes the nav (SECTION links to a hidden section disappear) — invalidate layout too.
  invalidate(CACHE_TAGS.sections, CACHE_TAGS.navigation);
  return saved();
}

/**
 * New order of the flow sections (Hero is always first and not part of it).
 * NOTE (Phase 4): the order is stored here; the public page renders sections
 * in this order once the registry-driven renderer lands in Phase 5.
 */
export async function reorderSectionsAction(keys: string[]): Promise<ActionState> {
  const user = await requireRole(SETTINGS_ROLES);
  const parsed = sectionOrderSchema.safeParse(keys);
  if (!parsed.success) return invalid(parsed.error, parsed.error.issues[0]?.message);

  await prisma.$transaction(
    parsed.data.map((key, index) =>
      prisma.section.upsert({
        where: { key },
        create: { key, sortOrder: (index + 1) * 10 },
        update: { sortOrder: (index + 1) * 10 },
      })
    )
  );

  await audit({ userId: user.id, action: "reorder", entity: "Section", summary: "Nova ordem das seções", diff: { order: parsed.data } });
  invalidate(CACHE_TAGS.sections);
  return saved();
}
