import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "./tags";
import { startOfTodayUTC, toMediaRef } from "./mappers";
import type { ShowDto } from "./dto";

const query = unstable_cache(
  async (): Promise<ShowDto[]> => {
    const rows = await prisma.show.findMany({
      where: { status: "PUBLISHED", showStatus: { not: "CANCELLED" }, date: { gte: startOfTodayUTC() } },
      orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
      include: { image: true },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      date: row.date.toISOString().slice(0, 10),
      time: row.time,
      city: row.city,
      state: row.state,
      venue: row.venue,
      country: row.country,
      ticketUrl: row.ticketUrl,
      soldOut: row.soldOut,
      featured: row.featured,
      image: toMediaRef(row.image),
    }));
  },
  ["content", "shows"],
  // Time-dependent (filters by "today"): a show disappearing up to an hour after its date is harmless.
  { tags: [CACHE_TAGS.shows, CACHE_TAGS.media, CACHE_TAGS.all], revalidate: 3600 }
);

/** Upcoming published shows. Empty → Shows renders its empty state + booking CTA. Admin-only fields never leave the server. */
export const getUpcomingShows = cache(query);
