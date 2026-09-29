import { prisma } from "@/lib/db";
import { SINGLETON_ID } from "@/lib/content/singleton";
import { legacyPlatformId, type LegacySocialPlatform } from "@/lib/validations/admin/settings";
import { SiteIdentityForm } from "./SiteIdentityForm";
import { SocialLinkRow } from "./SocialLinkRow";

const PLATFORMS: { platform: LegacySocialPlatform; label: string }[] = [
  { platform: "INSTAGRAM", label: "Instagram" },
  { platform: "SPOTIFY", label: "Spotify" },
  { platform: "APPLE_MUSIC", label: "Apple Music" },
  { platform: "YOUTUBE", label: "YouTube" },
  { platform: "TIKTOK", label: "TikTok" },
  { platform: "WHATSAPP", label: "WhatsApp" },
];

export default async function SettingsPage() {
  // TEMPORARY (Phase 3 → 4): the legacy identity form reads from brand + profile + site.
  const [site, brand, profile, socialLinks] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.brandSettings.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.profile.findUnique({ where: { id: SINGLETON_ID } }),
    prisma.socialLink.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Identidade</h2>
        <div className="mt-4">
          <SiteIdentityForm
            initialValues={{
              artistName: brand?.brandName,
              roles: profile?.rolesPt,
              startYear: profile?.foundedYear ?? undefined,
              bioShort: brand?.descriptionPt,
              whatsappNumber: site?.whatsappNumber ?? "",
            }}
          />
        </div>
      </section>

      <section className="mt-12 max-w-2xl border-t border-neutral-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Redes sociais</h2>
        <div className="mt-4">
          {PLATFORMS.map(({ platform, label }) => {
            const existing = socialLinks.find((l) => l.platform === legacyPlatformId(platform));
            return (
              <SocialLinkRow
                key={platform}
                platform={platform}
                defaultLabel={existing?.label ?? label}
                url={existing?.url ?? ""}
                configured={existing?.enabled ?? false}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
