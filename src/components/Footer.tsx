"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import type { SiteDto, SocialLinkDto } from "@/lib/content/dto";
import { scrollToSection } from "@/lib/lenisStore";
import { track } from "@/lib/analytics";
import { useLocale } from "@/i18n/LocaleProvider";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { Vinyl } from "@/components/Vinyl";

interface FooterProps {
  site: SiteDto;
  socialLinks: SocialLinkDto[];
}

/**
 * The closing frame: links, then the artist's name set edge to edge, and the
 * record from the opening turning quietly by "back to top" — the story ends
 * where the preloader began.
 */
export function Footer({ site, socialLinks }: FooterProps) {
  const year = new Date().getFullYear();
  const ref = useRef<HTMLElement>(null);
  const { t, tc } = useLocale();
  const reduced = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (!ref.current || reduced) return;
      gsap.fromTo(
        ".ft-word",
        { yPercent: 55 },
        { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".ft-word-wrap", start: "top bottom", end: "bottom bottom", scrub: 0.6 } }
      );
      gsap.fromTo(".ft-fade", { autoAlpha: 0, y: 20 }, {
        autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: "expo.out",
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      });
    },
    { scope: ref, dependencies: [reduced], revertOnUpdate: true }
  );

  return (
    <footer ref={ref} className="relative overflow-hidden border-t border-border pt-20 md:pt-28">
      <div className="container-edit relative z-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:items-end">
          <div className="ft-fade md:col-span-5">
            <p className="eyebrow">{site.roles.map(tc).join(" · ")}</p>
            <Image
              src="/images/logo-alan-saher.png"
              alt={site.artistName}
              width={559}
              height={480}
              sizes="(min-width: 768px) 140px, 112px"
              className="mt-5 h-24 w-auto md:h-30"
            />
          </div>

          <nav aria-label="Social" className="ft-fade flex flex-col gap-1 md:col-span-3">
            {socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target={link.configured ? "_blank" : undefined}
                rel="noreferrer"
                aria-disabled={!link.configured}
                onClick={(e) => {
                  if (!link.configured) e.preventDefault();
                  else if (link.platform === "instagram") track("instagram_click");
                }}
                className={`flex min-h-11 w-fit items-center text-sm uppercase tracking-[0.2em] ${
                  link.configured ? "link-draw text-fg-muted hover:text-fg" : "text-fg-muted/70"
                }`}
              >
                {link.label}
                {link.configured && <span className="sr-only">{t.newTab}</span>}
              </a>
            ))}
          </nav>

          <div className="ft-fade flex flex-col items-start gap-6 md:col-span-4 md:items-end">
            <button
              onClick={() => scrollToSection("booking")}
              className="flex min-h-11 items-center text-sm uppercase tracking-[0.2em] text-accent"
              data-cursor="go"
            >
              <span className="text-roll" data-text={t.footer.booking}>
                <span>{t.footer.booking}</span>
              </span>
            </button>
            <button
              onClick={() => scrollToSection("top")}
              className="group flex min-h-11 items-center gap-4 text-[11px] uppercase tracking-[0.25em] text-fg-muted transition-colors hover:text-fg"
            >
              {t.footer.backToTop}
              <Vinyl className="vinyl-idle size-14 transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-1" />
            </button>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-border py-6 text-xs text-fg-muted md:flex-row md:items-center md:justify-between">
          <span>
            © {year} {site.artistName}. {t.footer.rights}
          </span>
          {site.footerNote && <span>{tc(site.footerNote)}</span>}
        </div>
      </div>

      {/* Edge-to-edge wordmark: SVG textLength fits it to the exact width at any viewport. */}
      <div aria-hidden="true" className="ft-word-wrap overflow-hidden px-[var(--gutter)] pb-[var(--gutter)]">
        <svg viewBox="0 0 1000 124" className="ft-word block w-full select-none" role="presentation">
          <text
            x="0"
            y="112"
            textLength="1000"
            lengthAdjust="spacingAndGlyphs"
            fill="currentColor"
            className="text-fg"
            style={{ fontFamily: "var(--font-orbitron), sans-serif", fontWeight: 800, fontSize: 150, textTransform: "uppercase" }}
          >
            {site.artistName.toUpperCase()}
          </text>
        </svg>
      </div>
    </footer>
  );
}
