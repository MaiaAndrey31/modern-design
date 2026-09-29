import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { localizedList, localizedOptional } from "@/lib/i18n/locale";
import { CACHE_TAGS } from "./tags";
import { SINGLETON_ID } from "./singleton";
import { SYSTEM_DEFAULTS } from "./defaults";
import type { ProfileDto } from "./dto";

const d = SYSTEM_DEFAULTS.profile;

const query = unstable_cache(
  async (): Promise<ProfileDto> => {
    const row = (await prisma.profile.findUnique({ where: { id: SINGLETON_ID } })) ?? d;
    return {
      roles: localizedList(row.rolesPt, row.rolesEn),
      bio: localizedOptional(row.bioPt, row.bioEn),
      originLabel: localizedOptional(row.originLabelPt, row.originLabelEn),
      foundedYear: row.foundedYear,
    };
  },
  ["content", "profile"],
  { tags: [CACHE_TAGS.profile, CACHE_TAGS.all], revalidate: 3600 }
);

/** The subject presented by the template (roles, bio, origin, founded year). */
export const getProfile = cache(query);
