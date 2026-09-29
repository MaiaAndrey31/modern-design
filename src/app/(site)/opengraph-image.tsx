import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/lib/content/site";

export const alt = "Alan Saher — The Experience";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// CMS-driven (reads SiteSettings) — must not be frozen at build time, or an
// admin-edited artist name/tagline would only appear in shared links after
// the next deploy. The underlying getSiteSettings() call is still cached
// (see src/lib/content/site.ts), so this stays cheap.
export const dynamic = "force-dynamic";

export default async function Image() {
  const site = await getSiteSettings();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "#050505",
          padding: "80px",
          color: "#F5F5F2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, color: "#a3a29c", textTransform: "uppercase" }}>
          {site.roles.join(" · ")}
        </div>
        <div style={{ display: "flex", fontSize: 140, lineHeight: 0.95, marginTop: 24, letterSpacing: -2 }}>
          {site.artistName}
        </div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 32, color: "#D9A94E", letterSpacing: 2 }}>
          {site.tagline}
        </div>
      </div>
    ),
    { ...size }
  );
}
