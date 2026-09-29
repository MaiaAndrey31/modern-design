import type { ReactNode } from "react";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";

// Free (OFL) stand-in for the logo's Ethnocentric lettering — Ethnocentric
// itself needs a paid webfont license. Variable font (wght 400–900).
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * True app root. Intentionally minimal — no theme, no providers, no
 * page-specific metadata. The public site (dark, cinematic, GSAP/Lenis) and
 * the admin panel (light, plain) each own their own look via
 * `(site)/layout.tsx` and `(admin)/layout.tsx`, so neither ever inherits the
 * other's styling or JS.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
