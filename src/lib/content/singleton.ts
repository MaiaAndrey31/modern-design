/**
 * Every global settings model (SiteSettings, BrandSettings, ThemeSettings,
 * TypographySettings, HeaderSettings, FooterSettings, SeoSettings, Profile,
 * *Section singletons) has exactly one row with this id.
 *
 * Rules:
 *  - read:  prisma.x.findUnique({ where: { id: SINGLETON_ID } })
 *  - write: prisma.x.upsert({ where: { id: SINGLETON_ID }, create: {...}, update: {...} })
 *  - never findFirst(), never create() without the id.
 * The baseline migration adds CHECK ("id" = 'singleton') on each table, so a
 * second row is impossible at the database level too.
 */
export const SINGLETON_ID = "singleton" as const;

export const singletonWhere = { id: SINGLETON_ID } as const;
