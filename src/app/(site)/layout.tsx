import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getSiteSettings } from "@/lib/content/site";
import { getSeoSettings } from "@/lib/content/seo";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
import { CustomCursor } from "@/components/CustomCursor";
import { AppReadyProvider } from "@/hooks/useAppReady";
import { LocaleProvider } from "@/i18n/LocaleProvider";

import { siteUrl } from "@/lib/siteUrl";

export async function generateMetadata(): Promise<Metadata> {
  const [site, seo] = await Promise.all([getSiteSettings(), getSeoSettings()]);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: seo.metaTitle,
      template: `%s — ${site.artistName}`,
    },
    description: seo.metaDescription,
    authors: [{ name: site.artistName }],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: siteUrl,
      siteName: site.artistName,
      title: seo.metaTitle,
      description: seo.metaDescription,
      locale: "en_US",
      ...(seo.ogImageUrl && { images: [{ url: seo.ogImageUrl }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.metaTitle,
      description: seo.metaDescription,
      ...(seo.twitterHandle && { site: seo.twitterHandle, creator: seo.twitterHandle }),
      ...(seo.ogImageUrl && { images: [seo.ogImageUrl] }),
    },
    robots: { index: seo.robotsIndex, follow: seo.robotsIndex },
  };
}

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

/** Owns the public site's dark cinematic theme + motion stack (Lenis/GSAP/cursor). */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-bg text-fg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:bg-accent focus:text-bg focus:px-4 focus:py-2 focus:rounded"
      >
        Skip to content
      </a>
      <LocaleProvider>
        <AppReadyProvider>
          <SmoothScrollProvider>
            <CustomCursor />
            {children}
          </SmoothScrollProvider>
        </AppReadyProvider>
      </LocaleProvider>
    </div>
  );
}
