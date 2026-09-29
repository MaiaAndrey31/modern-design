"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { lockScroll, scrollToSection } from "@/lib/lenisStore";
import { useLocale } from "@/i18n/LocaleProvider";
import { useAppReady } from "@/hooks/useAppReady";
import { LocaleSwitch } from "@/components/LocaleSwitch";

export interface NavItem {
  label: string;
  id: string;
}

interface HeaderProps {
  artistName: string;
  navItems: NavItem[];
}

export function Header({ artistName, navItems }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuTlRef = useRef<gsap.core.Timeline | null>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLButtonElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const hasToggledRef = useRef(false);
  const { t } = useLocale();
  const { isReady } = useAppReady();
  const navLabel = (item: NavItem) => t.nav[item.id as keyof typeof t.nav] ?? item.label;

  const toggleMenu = (open: boolean) => {
    hasToggledRef.current = true;
    setIsMenuOpen(open);
  };


  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Skip the initial (closed) render — unlocking here on mount would
    // release the preloader's scroll lock.
    if (!hasToggledRef.current) return;
    lockScroll(isMenuOpen);
    // While the fullscreen menu covers the page, keep the content behind it
    // (and the logo, which sits under the menu's z-index) out of tab order
    // and away from screen readers — `inert` handles both at once.
    const main = document.getElementById("main-content");
    if (main) main.inert = isMenuOpen;
    return () => {
      if (main) main.inert = false;
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Menu can only be open after a user toggle, so focus handoff stays valid.
        setIsMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = [
        menuToggleRef.current,
        ...Array.from(menuRef.current?.querySelectorAll<HTMLElement>("button") ?? []),
      ].filter((el): el is HTMLElement => el !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  useGSAP(
    () => {
      if (!menuRef.current) return;
      const links = menuRef.current.querySelectorAll("[data-menu-link]");
      const tl = gsap.timeline({ paused: true })
        .to(menuRef.current, { autoAlpha: 1, duration: 0.4, ease: "power2.out" })
        .from(links, { yPercent: 110, autoAlpha: 0, duration: 0.7, stagger: 0.06, ease: "expo.out" }, "-=0.1");
      menuTlRef.current = tl;
    },
    { scope: menuRef }
  );

  useEffect(() => {
    // Never move focus on mount — only in response to the user toggling.
    if (!menuTlRef.current || !hasToggledRef.current) return;
    if (isMenuOpen) {
      menuTlRef.current.play();
      firstMenuLinkRef.current?.focus();
    } else {
      menuTlRef.current.reverse();
      menuToggleRef.current?.focus();
    }
  }, [isMenuOpen]);

  // Header settles in once the preloader's mask has opened.
  useGSAP(
    () => {
      if (!headerRef.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (!isReady) {
        gsap.set(headerRef.current, { autoAlpha: 0, y: -12 });
        return;
      }
      gsap.to(headerRef.current, { autoAlpha: 1, y: 0, duration: 1, delay: 1.1, ease: "expo.out" });
    },
    { dependencies: [isReady] }
  );

  const handleNavClick = (id: string) => {
    if (isMenuOpen) toggleMenu(false);
    scrollToSection(id, -80);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-[var(--z-header)] transition-colors duration-500 ${
          isScrolled ? "bg-bg/85 backdrop-blur-md border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="container-edit flex h-20 items-center justify-between">
          <a
            ref={logoRef}
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("top");
            }}
            tabIndex={isMenuOpen ? -1 : 0}
            className="block"
          >
            <Image
              src="/images/logo-alan-saher.png"
              alt={artistName}
              width={559}
              height={480}
              priority
              sizes="72px"
              className="h-12 w-auto md:h-14"
            />
          </a>

          <div className="hidden items-center gap-10 md:flex">
            <nav aria-label="Primary" className="flex items-center gap-8 lg:gap-10">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="group relative flex min-h-11 items-center text-xs uppercase tracking-[0.2em] text-fg-muted transition-colors duration-300 hover:text-fg"
                >
                  <span className="text-roll" data-text={navLabel(item)}>
                    <span>{navLabel(item)}</span>
                  </span>
                  <span className="absolute left-0 bottom-2 h-px w-full origin-right scale-x-0 bg-accent transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:origin-left group-hover:scale-x-100" />
                </button>
              ))}
            </nav>
            <span aria-hidden="true" className="h-4 w-px bg-border" />
            <LocaleSwitch />
          </div>

          <button
            ref={menuToggleRef}
            onClick={() => toggleMenu(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? t.menu.close : t.menu.open}
            className="relative z-[calc(var(--z-menu)+1)] -mr-2.5 flex h-11 w-11 flex-col items-center justify-center gap-[6px] md:hidden"
          >
            <span
              className={`h-px w-6 bg-fg transition-transform duration-300 ${isMenuOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
            />
            <span
              className={`h-px w-6 bg-fg transition-transform duration-300 ${isMenuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </header>

      <div
        ref={menuRef}
        id="mobile-menu"
        className="fixed inset-0 z-[var(--z-menu)] flex flex-col items-center justify-center gap-8 bg-bg opacity-0 md:hidden"
        style={{ visibility: "hidden" }}
        role="dialog"
        aria-modal="true"
        aria-label={t.menu.open}
        aria-hidden={!isMenuOpen}
      >
        {navItems.map((item, index) => (
          <button
            key={item.id}
            ref={index === 0 ? firstMenuLinkRef : undefined}
            data-menu-link
            onClick={() => handleNavClick(item.id)}
            className="overflow-hidden py-1 font-display text-4xl uppercase tracking-tight"
            tabIndex={isMenuOpen ? 0 : -1}
          >
            {navLabel(item)}
          </button>
        ))}
        <div data-menu-link className="mt-6">
          <LocaleSwitch />
        </div>
      </div>
    </>
  );
}
