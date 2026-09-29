import type { NextConfig } from "next";

// Pinned to the project's own host when NEXT_PUBLIC_SUPABASE_URL is set.
// If it's missing or empty at build time (easy to end up with on Vercel),
// fall back to any single *.supabase.co subdomain — still limited to public
// Storage objects — instead of silently 400-ing every uploaded image.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "*.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" },
    ],
  },
  // Prisma's query engine must not be bundled by Turbopack for the client;
  // this keeps it as a real Node dependency in server code paths.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
