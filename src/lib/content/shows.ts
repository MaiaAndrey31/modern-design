import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import type { ShowDto } from "./dto";

/** `@db.Date` columns round-trip as UTC-midnight `Date`s — compare against UTC-midnight "today" to avoid off-by-one-day drift. */
function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

const query = unstable_cache(
  async (): Promise<ShowDto[]> => {
    const rows = await prisma.show.findMany({
      where: { status: "PUBLISHED", showStatus: { not: "CANCELLED" }, date: { gte: startOfTodayUTC() } },
      orderBy: { date: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      date: row.date.toISOString().slice(0, 10),
      city: row.city,
      venue: row.venue,
      country: row.country,
      ticketUrl: row.ticketUrl,
      soldOut: row.soldOut,
    }));
  },
  ["content", "shows"],
  // Time-dependent (filters by "today"), so keep the window short — a show
  // disappearing from Upcoming up to an hour after its date is harmless.
  { tags: [CACHE_TAGS.shows, CACHE_TAGS.all], revalidate: 3600 }
);

/** Empty by design until real dates are confirmed — UpcomingShows.tsx renders a "no dates announced" state + Booking CTA. */
export const getUpcomingShows = cache(query);
