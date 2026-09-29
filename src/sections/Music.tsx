"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import type { ReleaseDto, SocialLinkDto } from "@/lib/content/dto";
import { Reveal } from "@/components/Reveal";
import { Vinyl } from "@/components/Vinyl";
import { track } from "@/lib/analytics";
import { useLocale } from "@/i18n/LocaleProvider";
import { useMotionProfile } from "@/hooks/useMotionProfile";

/** Outbound link with a rolling label and a diagonal arrow. */
function StreamLink({ href, label, onClick, disabled }: { href: string; label: string; onClick?: () => void; disabled?: boolean }) {
  const { t } = useLocale();
  if (disabled) {
    return (
      <span className="flex min-h-11 items-center text-xs uppercase tracking-[0.25em] text-fg-muted" aria-disabled="true">
        {label} — {t.music.comingSoon}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={onClick}
      data-cursor="play"
      className="group flex min-h-11 items-center gap-3 text-xs uppercase tracking-[0.25em] text-fg transition-colors duration-300 hover:text-accent"
    >
      <span className="text-roll" data-text={label}>
        <span>{label}</span>
      </span>
      <span className="arrow-swap" aria-hidden="true">
        <span>↗</span>
        <span>↗</span>
      </span>
      <span className="sr-only">{t.newTab}</span>
    </a>
  );
}

/**
 * Cover + record. The record sits behind the sleeve and, on hover/focus,
 * slides out and starts turning (CSS only). On touch screens it is pulled
 * out once when scrolled into view, so the gesture isn't hover-dependent.
 */
function Record({ cover, alt, children }: { cover: React.ReactNode; alt?: string; children?: React.ReactNode }) {
  return (
    <div className="record relative w-[78%] max-w-[440px]" aria-label={alt}>
      <div className="record-vinyl absolute inset-[3%] z-0">
        <Vinyl className="h-full w-full drop-shadow-[0_20px_40px_rgb(0_0_0/0.6)]" />
      </div>
      <div className="record-cover relative z-10 aspect-square w-full overflow-hidden bg-bg-raised shadow-[0_30px_60px_rgb(0_0_0/0.55)]">
        {cover}
      </div>
      {children}
    </div>
  );
}

/** Brand sleeve for the empty state — typographic artwork only, never a fake release. */
function BrandSleeve({ artistName, startYear }: { artistName: string; startYear: number }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between border border-border p-[8%]">
      <span className="text-[10px] uppercase tracking-[0.35em] text-fg-muted">{artistName}</span>
      <span aria-hidden="true" className="font-display text-[clamp(4rem,12vw,9rem)] leading-none tracking-tight text-fg/90">
        AS
      </span>
      <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-fg-muted">
        <span>Sul de Minas</span>
        <span className="tabular">{startYear}</span>
      </span>
    </div>
  );
}

function ReleaseCard({ release }: { release: ReleaseDto }) {
  const { tc } = useLocale();
  const primary = release.spotifyUrl ?? release.appleMusicUrl ?? release.youtubeUrl;
  return (
    <article className="flex flex-col gap-8">
      <Record
        alt={release.title}
        cover={
          release.cover ? (
            <Image src={release.cover} alt={`${release.title} — cover`} fill sizes="(min-width: 1024px) 30vw, 80vw" className="object-cover" loading="lazy" />
          ) : (
            <div className="absolute inset-0 flex items-end border border-border p-6">
              <span className="font-display text-2xl uppercase tracking-tight">{release.title}</span>
            </div>
          )
        }
      />
      <div>
        <span className="eyebrow tabular">
          {release.year} · {tc(release.type)}
        </span>
        <h3 className="mt-2 font-display text-2xl uppercase tracking-tight md:text-3xl">{release.title}</h3>
        <div className="mt-3 flex flex-wrap gap-x-8">
          {release.spotifyUrl && <StreamLink href={release.spotifyUrl} label="Spotify" onClick={() => track("spotify_click")} />}
          {release.appleMusicUrl && <StreamLink href={release.appleMusicUrl} label="Apple Music" />}
          {!release.spotifyUrl && !release.appleMusicUrl && primary && <StreamLink href={primary} label="YouTube" />}
        </div>
      </div>
    </article>
  );
}

interface MusicProps {
  releases: ReleaseDto[];
  socialLinks: SocialLinkDto[];
  artistName?: string;
  startYear?: number;
}

export function Music({ releases, socialLinks, artistName = "Alan Saher", startYear = 1993 }: MusicProps) {
  const ref = useRef<HTMLElement>(null);
  const { t } = useLocale();
  const { hover, reduced } = useMotionProfile();
  const spotify = socialLinks.find((link) => link.platform === "spotify");
  const appleMusic = socialLinks.find((link) => link.platform === "appleMusic");

  // Touch: pull the record out once, when it scrolls into view.
  useGSAP(
    () => {
      if (!ref.current || hover || reduced) return;
      gsap.utils.toArray<HTMLElement>(".record", ref.current).forEach((record) => {
        ScrollTrigger.create({
          trigger: record,
          start: "top 70%",
          once: true,
          onEnter: () => record.setAttribute("data-open", ""),
        });
      });
    },
    { scope: ref, dependencies: [hover, reduced], revertOnUpdate: true }
  );

  return (
    <section id="music" ref={ref} aria-label={t.music.eyebrow} className="relative overflow-hidden py-[var(--section-padding-y)]">
      <div className="container-edit">
        {releases.length > 0 ? (
          <>
            <Reveal className="mb-16">
              <span className="eyebrow">{t.music.eyebrow}</span>
              <h2 className="mt-4 font-display uppercase leading-[0.95] tracking-tight" style={{ fontSize: "var(--font-size-h2)" }}>
                {t.music.heading}
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-16 md:grid-cols-2 xl:grid-cols-3">
              {releases.map((release) => (
                <ReleaseCard key={release.id} release={release} />
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <span className="eyebrow">{t.music.eyebrow}</span>
              <h2 className="mt-4 font-display uppercase leading-[0.95] tracking-tight" style={{ fontSize: "var(--font-size-h1)" }}>
                {t.music.heading}
              </h2>
              <p className="mt-6 max-w-sm text-fg-muted" style={{ fontSize: "var(--font-size-body)" }}>
                {t.music.empty}
              </p>
              <div className="mt-8 flex flex-wrap gap-x-10">
                {[spotify, appleMusic].map(
                  (link) =>
                    link && (
                      <StreamLink
                        key={link.platform}
                        href={link.url}
                        label={link.label}
                        disabled={!link.configured}
                        onClick={() => link.platform === "spotify" && track("spotify_click")}
                      />
                    )
                )}
              </div>
            </Reveal>
            <Reveal className="lg:col-span-6 lg:col-start-7" delay={0.1}>
              <Record alt={artistName} cover={<BrandSleeve artistName={artistName} startYear={startYear} />} />
            </Reveal>
          </div>
        )}
      </div>
    </section>
  );
}
