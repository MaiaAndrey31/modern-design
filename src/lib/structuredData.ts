import type { SiteDto, SocialLinkDto, ShowDto } from "@/lib/content/dto";

import { siteUrl } from "@/lib/siteUrl";

export function getPersonJsonLd(site: SiteDto, socialLinks: SocialLinkDto[]) {
  const sameAs = socialLinks.filter((link) => link.configured).map((link) => link.url);

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.artistName,
    url: siteUrl,
    jobTitle: site.roles.join(", "),
    description: site.bioShort,
    ...(sameAs.length > 0 && { sameAs }),
  };
}

/** Only real, confirmed shows are emitted — never inferred or placeholder dates. */
export function getEventsJsonLd(site: SiteDto, shows: ShowDto[]) {
  return shows.map((show) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: show.title ?? `${site.artistName} — ${show.city}`,
    startDate: show.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: show.venue,
      address: show.country ? `${show.city}, ${show.country}` : show.city,
    },
    performer: { "@type": "Person", name: site.artistName },
    ...(show.ticketUrl && { url: show.ticketUrl }),
  }));
}
