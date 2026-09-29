-- Enable Row Level Security on every public table, with NO policies.
-- The app reaches these tables only through Prisma as the `postgres` role
-- (table owner, BYPASSRLS), so it is unaffected. This blocks the anon /
-- authenticated roles from reading or writing them through the public
-- Supabase REST API (the anon key ships to the browser).
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SiteSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Hero" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."StatementSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."StoryContent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."NarrativeSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ExperienceSection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PressKit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."BookingSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SeoSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TimelineEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."WorldStage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ExperienceFrame" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Release" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Show" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."GalleryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PressItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SocialLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."BookingRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AuditLog" ENABLE ROW LEVEL SECURITY;
