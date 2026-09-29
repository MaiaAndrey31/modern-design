import { prisma } from "@/lib/db";
import { SeoForm } from "./SeoForm";

import { siteUrl } from "@/lib/siteUrl";

export default async function SeoAdminPage() {
  const [seo, site] = await Promise.all([
    prisma.seoSettings.findUnique({ where: { id: "singleton" }, include: { ogImage: true } }),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">SEO</h1>
      <div className="mt-6">
        <SeoForm
          initialValues={{
            metaTitle: seo?.metaTitle ?? `${site?.artistName ?? "Alan Saher"} — The Experience`,
            metaDescription: seo?.metaDescription ?? site?.bioShort ?? "",
            twitterHandle: seo?.twitterHandle ?? "",
            robotsIndex: seo?.robotsIndex,
            ogImage: seo?.ogImage ? { id: seo.ogImage.id, url: seo.ogImage.url } : null,
            artistName: site?.artistName ?? "Alan Saher",
            siteUrl,
          }}
        />
      </div>
    </div>
  );
}
