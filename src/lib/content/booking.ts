import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import type { BookingSettingsDto } from "./dto";

const FALLBACK: BookingSettingsDto = {
  eyebrow: "Booking",
  heading: "Bring the experience to your event.",
  intro:
    "Festivals, private events, brand activations and more — tell us about your event and the team will get back to you.",
  successTitle: "Request received.",
  successMessage: "Thank you — the team will be in touch shortly.",
  isFormEnabled: true,
};

const query = unstable_cache(
  async (): Promise<BookingSettingsDto> => {
    const row = await prisma.bookingSettings.findUnique({ where: { id: "singleton" } });
    if (!row) return FALLBACK;
    return {
      eyebrow: row.eyebrow,
      heading: row.heading,
      intro: row.intro,
      successTitle: row.successTitle,
      successMessage: row.successMessage,
      isFormEnabled: row.isFormEnabled,
    };
  },
  ["content", "booking-settings"],
  { tags: [CACHE_TAGS.booking, CACHE_TAGS.all], revalidate: 3600 }
);

export const getBookingSettings = cache(query);
