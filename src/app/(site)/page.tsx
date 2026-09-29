import { Preloader } from "@/components/Preloader";
import { Header, type NavItem } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/sections/Hero";
import { Statement } from "@/sections/Statement";
import { Numbers } from "@/sections/Numbers";
import { Story } from "@/sections/Story";
import { WorldStages } from "@/sections/WorldStages";
import { NarrativeTransition } from "@/sections/NarrativeTransition";
import { Experience } from "@/sections/Experience";
import { Music } from "@/sections/Music";
import { Gallery } from "@/sections/Gallery";
import { Press } from "@/sections/Press";
import { PressKit } from "@/sections/PressKit";
import { UpcomingShows } from "@/sections/UpcomingShows";
import { Booking } from "@/sections/Booking";
import { getPersonJsonLd, getEventsJsonLd } from "@/lib/structuredData";
import type { SectionKey } from "@/lib/sections/registry";
import { getSections } from "@/lib/content/sections";
// TEMPORARY (Phase 3 → 5): pre-Modern prop shapes built from the new loaders.
import {
  getLegacySite,
  getLegacyHero,
  getLegacyStatement,
  getLegacyStory,
  getLegacyStages,
  getLegacyNarrative,
  getLegacyExperience,
  getLegacyReleases,
  getLegacyGallery,
  getLegacyPress,
  getLegacyPressKit,
  getLegacyShows,
  getLegacySocialLinks,
  getLegacyBooking,
} from "@/lib/content/legacy";

// Content changes go through the admin's revalidateTag/revalidatePath calls;
// this is a time-based backstop, not the primary invalidation mechanism.
export const revalidate = 3600;

export default async function Home() {
  const [sections, site, hero, statement, story, stages, narrative, experience, releases, gallery, press, pressKit, shows, social, booking] =
    await Promise.all([
      getSections(),
      getLegacySite(),
      getLegacyHero(),
      getLegacyStatement(),
      getLegacyStory(),
      getLegacyStages(),
      getLegacyNarrative(),
      getLegacyExperience(),
      getLegacyReleases(),
      getLegacyGallery(),
      getLegacyPress(),
      getLegacyPressKit(),
      getLegacyShows(),
      getLegacySocialLinks(),
      getLegacyBooking(),
    ]);
  // Visibility from the CMS; order stays fixed until the registry-driven renderer lands (Phase 5).
  const on = (key: SectionKey) => sections.byKey[key].enabled;

  const personJsonLd = getPersonJsonLd(site, social);
  const eventsJsonLd = getEventsJsonLd(site, shows);

  // Only link to sections that will actually render something — an empty
  // Story/Gallery renders null, so a static nav item would otherwise be a
  // dead scroll target.
  const navItems: NavItem[] = [
    on("story") && story.milestones.length > 0 && { label: "Story", id: "story" },
    on("music") && { label: "Music", id: "music" },
    on("shows") && { label: "Shows", id: "shows" },
    on("gallery") && gallery.length > 0 && { label: "Gallery", id: "gallery" },
    on("booking") && { label: "Booking", id: "booking" },
  ].filter((item): item is NavItem => Boolean(item));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      {eventsJsonLd.map((event, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(event) }} />
      ))}

      <Preloader />
      <Header artistName={site.artistName} navItems={navItems} />
      <main id="main-content">
        <Hero hero={hero} site={site} />
        {on("numbers") && (
          <Numbers startYear={site.startYear} stageYears={stages.filter((s) => s.showInNumbers).map((s) => ({ id: s.id, year: s.year }))} />
        )}
        {on("statement") && statement.lines.length > 0 && (
          <Statement lines={statement.lines} accentIndex={statement.accentIndex} backgroundUrl={statement.backgroundUrl} />
        )}
        {on("story") && <Story content={story.content} milestones={story.milestones} />}
        {on("narrative") && <NarrativeTransition {...narrative} />}
        {on("worldStages") && <WorldStages stages={stages} />}
        {on("experience") && <Experience {...experience} />}
        {on("music") && <Music releases={releases} socialLinks={social} artistName={site.artistName} startYear={site.startYear} />}
        {on("gallery") && <Gallery items={gallery} />}
        {on("press") && <Press items={press} />}
        {on("pressKit") && <PressKit pressKit={pressKit} />}
        {on("shows") && <UpcomingShows shows={shows} />}
        {on("booking") && <Booking settings={booking} />}
      </main>
      <Footer site={site} socialLinks={social} />
    </>
  );
}
