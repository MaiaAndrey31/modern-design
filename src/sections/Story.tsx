"use client";

import Image from "next/image";
import { useMemo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, requestScrollRefresh } from "@/lib/gsap";
import type { MilestoneDto } from "@/lib/content/legacyDto";
import { useMotionProfile } from "@/hooks/useMotionProfile";
import { useLocale } from "@/i18n/LocaleProvider";
import type { Locale } from "@/i18n/dictionary";
import { CHAPTERS, STORY_COPY, buildBeats, type Chapter } from "@/i18n/story";
import { StoryMap, type StoryMapHandle } from "@/components/story/StoryMap";
import { Vinyl } from "@/components/Vinyl";
import { scrollToY } from "@/lib/lenisStore";

interface StoryContentProps {
  eyebrow: string;
  headingLine1: string;
  headingLine2: string;
}

interface Photo {
  src: string;
  alt: string;
}

/** Scroll length of one beat-weight unit, as a fraction of the viewport height. */
const VH_PER_WEIGHT = 0.55;

const isRealImage = (url: string | null): url is string => !!url && !/placeholder/i.test(url);

/**
 * Narrative chapters (i18n/story.ts) + what the CMS knows:
 *  - real photographs are used on the chapter with the same year — never on
 *    archive-era chapters (no period photos exist; better no Alan than a
 *    misleading one). "Today" falls back to the most recent real photo.
 *  - any published milestone the team adds whose year isn't a chapter yet
 *    is appended before "Today", so the CMS keeps working.
 */
function mergeChapters(milestones: MilestoneDto[]): { chapters: Chapter[]; photos: Record<string, Photo> } {
  const photos: Record<string, Photo> = {};
  const known = new Set(CHAPTERS.map((c) => c.cmsYear).filter(Boolean));

  CHAPTERS.forEach((chapter) => {
    if (!chapter.cmsYear || chapter.archive) return;
    const m = milestones.find((x) => x.year === chapter.cmsYear);
    if (m && isRealImage(m.image)) photos[chapter.id] = { src: m.image, alt: `${m.title} — ${m.year}` };
  });
  if (!photos.today) {
    const recent = [...milestones].reverse().find((m) => isRealImage(m.image));
    if (recent?.image) photos.today = { src: recent.image, alt: "Alan Saher" };
  }

  const extras: Chapter[] = milestones
    .filter((m) => !known.has(m.year))
    .map((m) => ({
      id: `cms-${m.id}`,
      kind: "chapter",
      year: m.year,
      axis: m.year.slice(0, 4),
      ghost: { en: m.year.slice(0, 4), pt: m.year.slice(0, 4) },
      concept: { en: m.subtitle ?? "", pt: m.subtitle ?? "" },
      title: { en: m.title, pt: m.title },
      place: { en: m.subtitle ?? "", pt: m.subtitle ?? "" },
      text: { en: m.description, pt: m.description },
      visual: isRealImage(m.image) ? "photo" : "map",
      geo: { view: "world" },
      weight: 1,
    }));
  extras.forEach((c) => {
    const m = milestones.find((x) => `cms-${x.id}` === c.id);
    if (m && isRealImage(m.image)) photos[c.id] = { src: m.image, alt: `${m.title} — ${m.year}` };
  });

  const todayAt = CHAPTERS.findIndex((c) => c.id === "today");
  const chapters = [...CHAPTERS.slice(0, todayAt), ...extras, ...CHAPTERS.slice(todayAt)];
  return { chapters, photos };
}

/** Visual layer shared across chapters: both record chapters use ONE record (still → spinning). */
const visualKey = (c: Chapter | undefined) =>
  !c || c.visual === "map" ? null : c.visual === "record" || c.visual === "record-spin" ? "record" : `${c.visual}-${c.id}`;

const yearLabel = (c: Chapter, locale: Locale) => (c.id === "today" ? STORY_COPY.today[locale] : c.year);

/* ------------------------------------------------------------------ */
/* Shared bits                                                          */
/* ------------------------------------------------------------------ */

function SignalVisual({ locale }: { locale: Locale }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8">
      <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-fg">
        <span className="size-2 rounded-full bg-red-500 motion-safe:animate-pulse" />
        {STORY_COPY.live[locale]}
      </span>
      <div className="flex h-32 items-end gap-[6px]" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="story-bar block w-[5px] bg-gradient-to-t from-accent/30 to-accent"
            style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${-(i * 0.11) % 1.4}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function ScaleVisual({ chapter, locale }: { chapter: Chapter; locale: Locale }) {
  const [a, b] = (chapter.pull?.[locale] ?? "").split(/(?<=\.)\s+/);
  return (
    <div className="flex h-full w-full flex-col justify-center gap-4 px-[6%]">
      <p className="font-display uppercase leading-[1] tracking-tight" style={{ fontSize: "clamp(2rem, 1rem + 3.2vw, 4.25rem)" }}>
        {a}
      </p>
      {b && (
        <p className="font-display uppercase leading-[1] tracking-tight text-accent" style={{ fontSize: "clamp(2rem, 1rem + 3.2vw, 4.25rem)" }}>
          {b}
        </p>
      )}
    </div>
  );
}

function RecordVisual() {
  return (
    <div className="story-record relative flex h-full w-full items-center justify-center">
      {/* A single warm light that only "switches on" at the first dance floor. */}
      <div className="sty-record-light pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgb(217_169_78/0.18),transparent_60%)] opacity-0" />
      <Vinyl className="sty-record-disc w-[min(70%,26rem)] brightness-[0.55] transition-[filter] duration-1000" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop — pinned narrative                                           */
/* ------------------------------------------------------------------ */

function StoryDesktop({ content, chapters, photos }: { content: StoryContentProps; chapters: Chapter[]; photos: Record<string, Photo> }) {
  const sectionRef = useRef<HTMLElement>(null);
  const mapRef = useRef<StoryMapHandle | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const { locale, tc } = useLocale();
  const count = chapters.length;
  const beats = useMemo(() => buildBeats(chapters), [chapters]);
  const visualKeys = useMemo(() => [...new Set(chapters.map(visualKey).filter((k): k is string => !!k))], [chapters]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const q = gsap.utils.selector(section);
      const texts = q<HTMLElement>(".sty-text");
      const ghosts = q<HTMLElement>(".sty-ghost");
      const concepts = q<HTMLElement>(".sty-concept");
      const dots = q<HTMLElement>(".sty-dot");
      const mapLayer = q<HTMLElement>(".sty-map")[0];
      const record = q<HTMLElement>(".story-record")[0];
      const counter = q<HTMLElement>(".sty-count")[0];
      const fill = q<HTMLElement>(".sty-fill")[0];
      const visualEl = (key: string | null) => (key ? q<HTMLElement>(`[data-visual="${key}"]`)[0] : undefined);
      const linesOf = (i: number) => texts[i]?.querySelectorAll(".sty-l") ?? [];

      /* ---- Initial state: chapter 0 ---- */
      texts.forEach((_, i) => gsap.set(linesOf(i), { yPercent: i === 0 ? 0 : 110, y: 0 }));
      gsap.set(ghosts, { autoAlpha: 0 });
      gsap.set(concepts, { autoAlpha: 0 });
      gsap.set([ghosts[0], concepts[0]], { autoAlpha: 1 });
      q<HTMLElement>("[data-visual]").forEach((el) => gsap.set(el, { clipPath: "inset(100% 0% 0% 0%)" }));
      const firstVisual = visualEl(visualKey(chapters[0]));
      if (firstVisual) gsap.set(firstVisual, { clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(mapLayer, { opacity: chapters[0].visual === "map" ? 1 : 0.22 });

      let active = 0;
      const setChrome = (index: number) => {
        dots.forEach((dot, i) => {
          dot.toggleAttribute("data-active", i === index);
          dot.toggleAttribute("data-past", i < index);
        });
        if (counter) counter.textContent = String(index + 1).padStart(2, "0");
        gsap.to(fill, { scaleX: count > 1 ? index / (count - 1) : 1, duration: 0.9, ease: "power3.out", overwrite: true });
        record?.toggleAttribute("data-spin", chapters[index].visual === "record-spin");
        const lit = chapters[index].visual === "record-spin";
        gsap.to(q(".sty-record-light"), { opacity: lit ? 1 : 0, duration: 1.2 });
        q<HTMLElement>(".sty-record-disc").forEach((d) => d.classList.toggle("brightness-[0.55]", !lit));
      };
      setChrome(0);

      const show = (next: number) => {
        if (next === active) return;
        const dir = next > active ? 1 : -1;
        const prev = active;
        active = next;

        gsap.to(linesOf(prev), { yPercent: -110 * dir, duration: 0.5, stagger: 0.03, ease: "power3.in", overwrite: true });
        gsap.fromTo(linesOf(next), { yPercent: 110 * dir, y: 0 }, { yPercent: 0, duration: 1, stagger: 0.06, ease: "expo.out", delay: 0.28, overwrite: true });

        gsap.to([ghosts[prev], concepts[prev]], { autoAlpha: 0, yPercent: -14 * dir, duration: 0.7, ease: "power2.inOut", overwrite: true });
        gsap.fromTo([ghosts[next], concepts[next]], { autoAlpha: 0, yPercent: 14 * dir }, { autoAlpha: 1, yPercent: 0, duration: 1.1, ease: "power3.out", overwrite: true });

        const pv = visualKey(chapters[prev]);
        const nv = visualKey(chapters[next]);
        if (pv !== nv) {
          const out = visualEl(pv);
          const inn = visualEl(nv);
          if (out) gsap.to(out, { clipPath: dir > 0 ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)", duration: 1, ease: "power4.inOut", overwrite: true });
          if (inn) {
            gsap.fromTo(inn, { clipPath: dir > 0 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power4.inOut", overwrite: true });
            const img = inn.querySelector(".sty-photo");
            if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: "expo.out" });
          }
        }
        gsap.to(mapLayer, { opacity: chapters[next].visual === "map" ? 1 : 0.22, duration: 0.9, overwrite: true });
        mapRef.current?.goTo(next);
        setChrome(next);
      };

      /* ---- Interludes: paused timelines whose progress follows scroll ---- */
      // "How?" — the question the previous section raised; lifts off onto 1993.
      gsap.set(".sty-intro", { autoAlpha: 1 });
      const intro = gsap
        .timeline({ paused: true })
        .to(".sty-intro-l", { yPercent: -110, duration: 0.3, stagger: 0.05, ease: "power3.in" }, 0.45)
        .to(".sty-intro", { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" }, 0.7);

      // The break: the screen goes dark, the thesis returns, 2014 surges.
      gsap.set(".sty-break", { autoAlpha: 0 });
      gsap.set(".sty-break-l", { yPercent: 110, y: 0 });
      gsap.set(".sty-break-year", { autoAlpha: 0, scale: 0.7 });
      const brk = gsap.timeline({ paused: true }).to(".sty-break", { autoAlpha: 1, duration: 0.14, ease: "power1.inOut" }, 0);
      q(".sty-break-l").forEach((line, i) => brk.to(line, { yPercent: 0, duration: 0.13, ease: "power3.out" }, 0.17 + i * 0.16));
      brk
        .to(".sty-break-l", { yPercent: -110, duration: 0.1, stagger: 0.02, ease: "power3.in" }, 0.72)
        .to(".sty-break-year", { autoAlpha: 1, scale: 1, duration: 0.14, ease: "expo.out" }, 0.78)
        .to(".sty-break", { autoAlpha: 0, duration: 0.1, ease: "power2.in" }, 0.9);

      // Outro: the closing lines, then darkness that the manifesto opens from.
      gsap.set(".sty-outro", { autoAlpha: 0 });
      gsap.set(".sty-outro-l", { yPercent: 110, y: 0 });
      const outro = gsap.timeline({ paused: true }).to(".sty-outro", { autoAlpha: 1, duration: 0.15, ease: "power1.inOut" }, 0);
      q(".sty-outro-l").forEach((line, i) => outro.to(line, { yPercent: 0, duration: 0.13, ease: "power3.out" }, 0.18 + i * 0.17));
      outro.to(".sty-outro-lines", { autoAlpha: 0, duration: 0.12, ease: "power2.in" }, 0.88);
      const interludes: Record<string, gsap.core.Timeline> = { intro, break: brk, outro };

      /* ---- Beat map ---- */
      const weights = beats.map((b) => b.weight);
      const total = weights.reduce((a, b) => a + b, 0);
      const starts = weights.map((_, i) => weights.slice(0, i).reduce((a, b) => a + b, 0));
      // Interludes show the chapter they lead into (break → 2014; outro → today).
      const chapterOfBeat = beats.map((b, i) => {
        if (b.kind === "chapter") return chapters.indexOf(b);
        const nextChapter = beats.slice(i + 1).find((x): x is Chapter => x.kind === "chapter");
        return nextChapter ? chapters.indexOf(nextChapter) : count - 1;
      });

      const apply = (progress: number) => {
        const p = progress * total;
        let b = starts.findIndex((s, i) => p >= s && p < s + weights[i]);
        if (b === -1) b = beats.length - 1;
        const t = gsap.utils.clamp(0, 1, (p - starts[b]) / weights[b]);
        show(chapterOfBeat[b]);
        beats.forEach((beat, i) => {
          if (beat.kind !== "interlude") return;
          interludes[beat.id]?.progress(i === b ? t : i < b ? 1 : 0);
        });
      };

      triggerRef.current = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${window.innerHeight * total * VH_PER_WEIGHT}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      });

      requestScrollRefresh();
      return () => {
        triggerRef.current = null;
      };
    },
    { scope: sectionRef, dependencies: [count] }
  );

  /** Axis dots jump to the middle of that chapter's beat. */
  const jumpTo = (index: number) => {
    const st = triggerRef.current;
    if (!st) return;
    const weights = beats.map((b) => b.weight);
    const total = weights.reduce((a, b) => a + b, 0);
    const beatIndex = beats.indexOf(chapters[index]);
    const start = weights.slice(0, beatIndex).reduce((a, b) => a + b, 0);
    scrollToY(st.start + ((start + weights[beatIndex] * 0.35) / total) * (st.end - st.start));
  };

  const thesis = STORY_COPY.thesis[locale];
  const outroLines = STORY_COPY.outro[locale];

  return (
    <section id="story" ref={sectionRef} aria-label={tc(content.eyebrow)} className="relative h-screen overflow-hidden bg-bg">
      {/* Giant ghost year */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[9vh] select-none">
        {chapters.map((c) => (
          <span
            key={c.id}
            className="sty-ghost absolute bottom-0 left-[var(--gutter)] whitespace-nowrap font-display uppercase leading-none tracking-tighter text-fg/[0.05]"
            style={{ fontSize: "clamp(9rem, 24vw, 28rem)" }}
          >
            {c.ghost[locale]}
          </span>
        ))}
      </div>

      <div className="container-edit relative grid h-full grid-cols-12 items-center gap-8 pb-32 pt-28">
        {/* Left — words */}
        <div className="col-span-5 flex h-full flex-col justify-between">
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-fg-muted">
            <span className="eyebrow">{tc(content.eyebrow)}</span>
            <span className="h-px w-8 bg-border" />
            <span className="tabular text-fg">
              <span className="sty-count">01</span> / {String(count).padStart(2, "0")}
            </span>
            <span className="relative h-4 flex-1">
              {chapters.map((c) => (
                <span key={c.id} className="sty-concept absolute left-0 top-0 whitespace-nowrap text-accent">
                  {c.concept[locale]}
                </span>
              ))}
            </span>
          </div>

          <div className="relative min-h-[22rem]">
            {chapters.map((c, i) => (
              <article key={c.id} className="sty-text absolute inset-x-0 bottom-0">
                <span className="line-mask">
                  <span className="sty-l tabular font-display uppercase text-accent" style={{ fontSize: "var(--font-size-h2)" }}>
                    {yearLabel(c, locale)}
                  </span>
                </span>
                <h3 className="mt-2 font-display text-3xl uppercase leading-[1.05] tracking-tight xl:text-4xl">
                  <span className="line-mask">
                    <span className="sty-l">{c.title[locale]}</span>
                  </span>
                </h3>
                <span className="line-mask mt-4">
                  <span className="sty-l flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-fg-muted">
                    <span className="inline-block size-1.5 rounded-full bg-accent" />
                    {c.place[locale]}
                  </span>
                </span>
                <span className="line-mask mt-4">
                  <span className="sty-l max-w-[34rem] leading-relaxed text-fg/80" style={{ fontSize: "var(--font-size-body)" }}>
                    {c.text[locale]}
                  </span>
                </span>
                <span className="sr-only">
                  {STORY_COPY.chapter[locale]} {i + 1} / {count}
                </span>
              </article>
            ))}
          </div>
        </div>

        {/* Right — the visual stage: geography underneath, chapter visuals on top */}
        <div className="relative col-span-6 col-start-7 h-[62vh] overflow-hidden">
          {/* Edges dissolve into the page — geography as atmosphere, not a framed map. */}
          <div className="sty-map absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,#000_45%,transparent_78%)]">
            <StoryMap chapters={chapters} locale={locale} handleRef={mapRef} />
          </div>
          {visualKeys.map((key) => {
            const chapter = chapters.find((c) => visualKey(c) === key)!;
            return (
              <div key={key} data-visual={key} className="absolute inset-0 bg-bg">
                {key === "record" && <RecordVisual />}
                {chapter.visual === "scale" && <ScaleVisual chapter={chapter} locale={locale} />}
                {chapter.visual === "signal" && <SignalVisual locale={locale} />}
                {chapter.visual === "photo" && photos[chapter.id] && (
                  <div className="sty-photo absolute inset-0 will-change-transform">
                    <Image src={photos[chapter.id].src} alt={photos[chapter.id].alt} fill sizes="50vw" className="object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
                  </div>
                )}
                {chapter.visual === "photo" && !photos[chapter.id] && <SignalVisual locale={locale} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Career line: 1993 ●━━━━━○○○ TODAY */}
      <div className="container-edit absolute inset-x-0 bottom-8">
        <div className="relative">
          <div className="absolute left-0 right-0 top-[5px] h-px bg-fg/10">
            <div className="sty-fill h-px origin-left scale-x-0 bg-accent" />
          </div>
          <ol className="relative flex justify-between">
            {chapters.map((c, i) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  className="sty-dot group flex min-h-11 flex-col items-start gap-3 text-[10px] uppercase tracking-[0.18em] text-fg-muted transition-colors duration-300 hover:text-fg data-[active]:text-fg"
                  aria-label={`${yearLabel(c, locale)} — ${c.title[locale]}`}
                >
                  <span className="block size-[11px] rounded-full border border-fg/30 bg-bg transition-[transform,background-color,border-color] duration-500 group-data-[past]:border-accent/60 group-data-[active]:scale-125 group-data-[active]:border-accent group-data-[active]:bg-accent" />
                  <span className="tabular">{c.axis ? (c.id === "today" ? STORY_COPY.today[locale] : c.axis) : " "}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Interlude: "How?" */}
      <div className="sty-intro absolute inset-0 z-30 flex flex-col items-center justify-center bg-bg px-[var(--gutter)] text-center">
        <span className="line-mask">
          <span className="sty-intro-l eyebrow">{tc(content.eyebrow)}</span>
        </span>
        <p className="mt-6 font-display uppercase leading-[1] tracking-tight" style={{ fontSize: "clamp(3.5rem, 2rem + 8vw, 10rem)" }}>
          <span className="line-mask">
            <span className="sty-intro-l">{STORY_COPY.how[locale]}</span>
          </span>
        </p>
        <p className="mt-6 font-display text-xl uppercase tracking-tight text-fg-muted md:text-2xl">
          <span className="line-mask">
            <span className="sty-intro-l">
              {tc(content.headingLine1)} {tc(content.headingLine2)}
            </span>
          </span>
        </p>
      </div>

      {/* Interlude: the break — From Minas → to the world */}
      <div aria-hidden="true" className="sty-break invisible absolute inset-0 z-30 flex flex-col items-center justify-center bg-bg text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(217_169_78/0.07),transparent_60%)]" />
        <p className="relative font-display uppercase leading-[1] tracking-tight" style={{ fontSize: "clamp(3.5rem, 1.5rem + 8vw, 11rem)" }}>
          {thesis.map((line, i) => (
            <span key={i} className="line-mask">
              <span className={`sty-break-l ${i === thesis.length - 1 ? "text-accent" : ""}`}>{line}</span>
            </span>
          ))}
        </p>
        <span className="sty-break-year tabular absolute font-display leading-none text-fg/[0.08]" style={{ fontSize: "clamp(12rem, 34vw, 38rem)" }}>
          2014
        </span>
      </div>

      {/* Interlude: outro — leads straight into the manifesto */}
      <div aria-hidden="true" className="sty-outro invisible absolute inset-0 z-30 flex items-center justify-center bg-bg px-[var(--gutter)] text-center">
        <p className="sty-outro-lines font-display uppercase leading-[1.05] tracking-tight" style={{ fontSize: "clamp(2.25rem, 1rem + 4.6vw, 6.5rem)" }}>
          {outroLines.map((line, i) => (
            <span key={i} className="line-mask">
              <span className={`sty-outro-l ${i === outroLines.length - 1 ? "text-accent" : ""}`}>{line}</span>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile / reduced motion — vertical timeline                          */
/* ------------------------------------------------------------------ */

function MobileVisual({ chapter, index, chapters, photos, locale }: { chapter: Chapter; index: number; chapters: Chapter[]; photos: Record<string, Photo>; locale: Locale }) {
  if (chapter.visual === "photo" && photos[chapter.id]) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <Image src={photos[chapter.id].src} alt={photos[chapter.id].alt} fill sizes="100vw" className="object-cover" loading="lazy" />
      </div>
    );
  }
  if (chapter.visual === "record" || chapter.visual === "record-spin") {
    return (
      <div className="story-record flex aspect-[16/10] w-full items-center justify-center bg-bg-raised" data-spin={chapter.visual === "record-spin" ? "" : undefined}>
        <Vinyl className={`w-[58%] ${chapter.visual === "record" ? "brightness-[0.55]" : ""}`} />
      </div>
    );
  }
  if (chapter.visual === "scale") {
    return (
      <div className="flex aspect-[16/10] w-full items-center bg-bg-raised">
        <ScaleVisual chapter={chapter} locale={locale} />
      </div>
    );
  }
  if (chapter.visual === "signal" || chapter.visual === "photo") {
    return (
      <div className="aspect-[16/10] w-full bg-bg-raised">
        <SignalVisual locale={locale} />
      </div>
    );
  }
  return (
    <div className="aspect-[16/10] w-full overflow-hidden bg-bg-raised">
      <StoryMap chapters={chapters} locale={locale} staticIndex={index} />
    </div>
  );
}

function StoryMobile({ content, chapters, photos, reduced }: { content: StoryContentProps; chapters: Chapter[]; photos: Record<string, Photo>; reduced: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { tc, locale } = useLocale();
  const beats = useMemo(() => buildBeats(chapters), [chapters]);

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.fromTo(".stm-fill", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".stm-list", start: "top 70%", end: "bottom 70%", scrub: true } });
      gsap.utils.toArray<HTMLElement>(".stm-item", ref.current).forEach((item) => {
        gsap.fromTo(item.querySelectorAll(".stm-rise"), { autoAlpha: 0, y: 28 }, {
          autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: "expo.out",
          scrollTrigger: { trigger: item, start: "top 84%", once: true },
        });
        const dot = item.querySelector(".stm-dot");
        if (dot) {
          gsap.fromTo(dot, { backgroundColor: "rgb(5 5 5)", borderColor: "rgb(245 245 242 / 0.3)" }, {
            backgroundColor: "#d9a94e", borderColor: "#d9a94e", duration: 0.4,
            scrollTrigger: { trigger: item, start: "top 70%", toggleActions: "play none none reverse" },
          });
        }
      });
      gsap.utils.toArray<HTMLElement>(".stm-statement", ref.current).forEach((block) => {
        const lines = block.querySelectorAll(".stm-line");
        gsap.set(lines, { yPercent: 110, y: 0 });
        gsap.to(lines, { yPercent: 0, stagger: 0.25, ease: "power3.out", scrollTrigger: { trigger: block, start: "top 75%", end: "center 55%", scrub: 0.6 } });
      });
    },
    { scope: ref, dependencies: [reduced, chapters.length], revertOnUpdate: true }
  );

  const statement = (lines: readonly string[], key: string) => (
    <li key={key} className="stm-statement relative -ml-8 flex min-h-[70svh] items-center py-16 md:-ml-12">
      <p className="font-display uppercase leading-[1.02] tracking-tight" style={{ fontSize: "clamp(2.6rem, 1.2rem + 7vw, 5.5rem)" }}>
        {lines.map((line, i) => (
          <span key={i} className="line-mask">
            <span className={`stm-line ${i === lines.length - 1 ? "text-accent" : ""}`}>{line}</span>
          </span>
        ))}
      </p>
    </li>
  );

  return (
    <section id="story" ref={ref} aria-label={tc(content.eyebrow)} className="relative py-[var(--section-padding-y)]">
      <div className="container-edit">
        <span className="eyebrow">{tc(content.eyebrow)}</span>
        <p className="mt-4 font-display uppercase leading-[0.95] tracking-tight" style={{ fontSize: "var(--font-size-h1)" }}>
          {STORY_COPY.how[locale]}
        </p>
        <h2 className="mb-16 mt-4 font-display text-xl uppercase tracking-tight text-fg-muted">
          {tc(content.headingLine1)} {tc(content.headingLine2)}
        </h2>

        <ol className="stm-list relative space-y-20 pl-8 md:pl-12">
          <span aria-hidden="true" className="absolute bottom-0 left-[5px] top-2 w-px bg-fg/10">
            <span className={`stm-fill absolute inset-0 origin-top bg-accent ${reduced ? "" : "scale-y-0"}`} />
          </span>
          {beats.map((beat) => {
            if (beat.kind === "interlude") {
              if (beat.id === "break") return statement(STORY_COPY.thesis[locale], "break");
              if (beat.id === "outro") return statement(STORY_COPY.outro[locale], "outro");
              return null;
            }
            const i = chapters.indexOf(beat);
            const c = beat as Chapter;
            return (
              <li key={c.id} className="stm-item relative">
                <span aria-hidden="true" className="stm-dot absolute -left-8 top-2 size-[11px] rounded-full border border-fg/30 bg-bg md:-left-12" />
                <span className="stm-rise block text-[10px] uppercase tracking-[0.3em] text-accent">{c.concept[locale]}</span>
                <span className="stm-rise tabular mt-2 block font-display text-3xl uppercase text-accent">{yearLabel(c, locale)}</span>
                <h3 className="stm-rise mt-1 font-display text-xl uppercase tracking-tight">{c.title[locale]}</h3>
                <p className="stm-rise mt-2 text-[11px] uppercase tracking-[0.25em] text-fg-muted">{c.place[locale]}</p>
                <p className="stm-rise mt-4 max-w-prose leading-relaxed text-fg/80" style={{ fontSize: "var(--font-size-body)" }}>
                  {c.text[locale]}
                </p>
                <div className="stm-rise mt-6">
                  <MobileVisual chapter={c} index={i} chapters={chapters} photos={photos} locale={locale} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

interface StoryProps {
  content: StoryContentProps;
  milestones: MilestoneDto[];
}

/** From Minas to the world, proven chapter by chapter: pinned narrative on desktop, vertical timeline on touch/small screens and for reduced motion. */
export function Story({ content, milestones }: StoryProps) {
  const { desktop, reduced } = useMotionProfile();
  const { chapters, photos } = useMemo(() => mergeChapters(milestones), [milestones]);

  if (!desktop) return <StoryMobile content={content} chapters={chapters} photos={photos} reduced={reduced} />;
  return <StoryDesktop content={content} chapters={chapters} photos={photos} />;
}
