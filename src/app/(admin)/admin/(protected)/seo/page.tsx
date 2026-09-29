import { prisma } from "@/lib/db";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { SYSTEM_DEFAULTS } from "@/lib/content/defaults";
import { SeoForm } from "./SeoForm";

import { siteUrl } from "@/lib/siteUrl";

export default async function SeoAdminPage() {
  const [seo, brand] = await Promise.all([
    // TEMPORARY (Phase 3 → 4): PT fields; brand identity from BrandSettings.
    prisma.seoSettings.findUnique({ where: { id: SINGLETON_ID }, include: { ogImage: true } }),
    prisma.brandSettings.findUnique({ where: { id: SINGLETON_ID } }),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">SEO</h1>
      <div className="mt-6">
        <SeoForm
          initialValues={{
            metaTitle: seo?.metaTitlePt || (brand ? `${brand.brandName} — ${brand.taglinePt}` : ""),
            metaDescription: seo?.metaDescriptionPt || brand?.descriptionPt || "",
            twitterHandle: seo?.twitterHandle ?? "",
            robotsIndex: seo?.robotsIndex,
            ogImage: seo?.ogImage ? { id: seo.ogImage.id, url: seo.ogImage.url } : null,
            artistName: brand?.brandName ?? SYSTEM_DEFAULTS.brand.brandName,
            siteUrl,
          }}
        />
      </div>
    </div>
  );
}
