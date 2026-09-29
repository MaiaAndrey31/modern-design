import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localized } from "@/lib/i18n/locale";
import { BOOKING_FORM_FIELDS, type BookingFieldLabels, type BookingFormField } from "@/lib/booking/fields";
import { bookingFieldLabelsSchema } from "@/lib/validations/cms/sections";
import type { Localized } from "@/lib/i18n/locale";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import { localizedOr } from "./mappers";
import type { BookingDto } from "./dto";

const d = SYSTEM_DEFAULTS.booking;

/**
 * `fieldLabels` is JSON: it's parsed with its Zod schema before use. An
 * invalid document (hand-edited, older shape) falls back to the defaults
 * field by field — the form never renders a missing or malformed label.
 */
function parseFieldLabels(raw: unknown): Record<BookingFormField, Localized> {
  const parsed = bookingFieldLabelsSchema.safeParse(raw);
  const source: BookingFieldLabels = parsed.success ? parsed.data : d.fieldLabels;
  return Object.fromEntries(
    BOOKING_FORM_FIELDS.map((field) => [field, localized(source[field].pt, source[field].en)])
  ) as Record<BookingFormField, Localized>;
}

const query = unstable_cache(
  async (): Promise<BookingDto> => {
    const row = (await prisma.bookingSection.findUnique({ where: { id: SINGLETON_ID } })) ?? d;
    return {
      successTitle: localizedOr(row.successTitlePt, row.successTitleEn, { pt: d.successTitlePt, en: d.successTitleEn }),
      successMessage: localizedOr(row.successMessagePt, row.successMessageEn, { pt: d.successMessagePt, en: d.successMessageEn }),
      submitLabel: localizedOr(row.submitLabelPt, row.submitLabelEn, { pt: d.submitLabelPt, en: d.submitLabelEn }),
      pausedMessage: localizedOr(row.pausedMessagePt, row.pausedMessageEn, { pt: d.pausedMessagePt, en: d.pausedMessageEn }),
      fieldLabels: parseFieldLabels(row.fieldLabels),
      isFormEnabled: row.isFormEnabled,
    };
  },
  ["content", "booking"],
  { tags: [CACHE_TAGS.booking, CACHE_TAGS.all], revalidate: 3600 }
);

/** Public booking copy. `notifyEmail` is admin-only and intentionally not exposed. */
export const getBooking = cache(query);
