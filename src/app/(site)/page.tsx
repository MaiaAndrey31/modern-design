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
import { getSiteSettings } from "@/lib/content/site";
import { getHero } from "@/lib/content/hero";
import { getStatement } from "@/lib/content/statement";
import { getStory } from "@/lib/content/story";
import { getWorldStages } from "@/lib/content/worldStages";
import { getNarrative } from "@/lib/content/narrative";
import { getExperience } from "@/lib/content/experience";
import { getReleases } from "@/lib/content/releases";
import { getGallery } from "@/lib/content/gallery";
import { getPress, getPressKit } from "@/lib/content/press";
import { getUpcomingShows } from "@/lib/content/shows";
import { getSocialLinks } from "@/lib/content/social";
import { getBookingSettings } from "@/lib/content/booking";

// Content changes go through the admin's revalidateTag/revalidatePath calls;
// this is a time-based backstop, not the primary invalidation mechanism.
export const revalidate = 3600;

export default async function Home() {
  const [site, hero, statement, story, stages, narrative, experience, releases, gallery, press, pressKit, shows, social, booking] =
    await Promise.all([
      getSiteSettings(),
      getHero(),
      getStatement(),
      getStory(),
      getWorldStages(),
      getNarrative(),
      getExperience(),
      getReleases(),
      getGallery(),
      getPress(),
      getPressKit(),
      getUpcomingShows(),
      getSocialLinks(),
      getBookingSettings(),
    ]);

  const personJsonLd = getPersonJsonLd(site, social);
  const eventsJsonLd = getEventsJsonLd(site, shows);

  // Only link to sections that will actually render something — an empty
  // Story/Gallery renders null, so a static nav item would otherwise be a
  // dead scroll target.
  const navItems: NavItem[] = [
    story.milestones.length > 0 && { label: "Story", id: "story" },
    { label: "Music", id: "music" },
    { label: "Shows", id: "shows" },
    gallery.length > 0 && { label: "Gallery", id: "gallery" },
    { label: "Booking", id: "booking" },
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
        <Numbers startYear={site.startYear} stageYears={stages.filter((s) => s.showInNumbers).map((s) => ({ id: s.id, year: s.year }))} />
        {/* Thesis ("From Minas to the World") → proof (Story) → manifesto → showcase. */}
        <Statement lines={statement.lines} accentIndex={statement.accentIndex} backgroundUrl={statement.backgroundUrl} />
        <Story content={story.content} milestones={story.milestones} />
        <NarrativeTransition {...narrative} />
        <WorldStages stages={stages} />
        <Experience {...experience} />
        <Music releases={releases} socialLinks={social} artistName={site.artistName} startYear={site.startYear} />
        <Gallery items={gallery} />
        <Press items={press} />
        <PressKit pressKit={pressKit} />
        <UpcomingShows shows={shows} />
        <Booking settings={booking} />
      </main>
      <Footer site={site} socialLinks={social} />
    </>
  );
}
