import { prisma } from "@/lib/db";
import { SiteIdentityForm } from "./SiteIdentityForm";
import { SocialLinkRow } from "./SocialLinkRow";

const PLATFORMS: { platform: "INSTAGRAM" | "SPOTIFY" | "APPLE_MUSIC" | "YOUTUBE" | "TIKTOK" | "WHATSAPP"; label: string }[] = [
  { platform: "INSTAGRAM", label: "Instagram" },
  { platform: "SPOTIFY", label: "Spotify" },
  { platform: "APPLE_MUSIC", label: "Apple Music" },
  { platform: "YOUTUBE", label: "YouTube" },
  { platform: "TIKTOK", label: "TikTok" },
  { platform: "WHATSAPP", label: "WhatsApp" },
];

export default async function SettingsPage() {
  const [site, socialLinks] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.socialLink.findMany(),
  ]);

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Identidade</h2>
        <div className="mt-4">
          <SiteIdentityForm
            initialValues={{
              artistName: site?.artistName,
              roles: site?.roles,
              startYear: site?.startYear,
              bioShort: site?.bioShort,
              whatsappNumber: site?.whatsappNumber ?? "",
            }}
          />
        </div>
      </section>

      <section className="mt-12 max-w-2xl border-t border-neutral-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Redes sociais</h2>
        <div className="mt-4">
          {PLATFORMS.map(({ platform, label }) => {
            const existing = socialLinks.find((l) => l.platform === platform);
            return (
              <SocialLinkRow
                key={platform}
                platform={platform}
                defaultLabel={existing?.label ?? label}
                url={existing?.url ?? ""}
                configured={existing?.isConfigured ?? false}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
