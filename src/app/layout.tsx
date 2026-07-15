import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono, Anton, Bebas_Neue, VT323 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// Anton — condensed bold sans-serif (fallback)
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

// Bebas Neue — bold, wide, sans-serif for transition text (LERNIS-style)
const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

// VT323 — pixel/retro font for speech bubbles (matches Goddess pixel art)
const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Arjun Vashishtha — Full-Stack Developer & AI Builder",
  description: "Portfolio of Arjun Vashishtha — 4th-year B.Tech CSE student at VIT Bhopal. Building autonomous AI agents, full-stack apps, and data-driven solutions.",
  keywords: ["Arjun Vashishtha", "AI Agent", "Full-Stack Developer", "Next.js", "React", "Python", "Machine Learning", "Portfolio"],
  authors: [{ name: "Arjun Vashishtha" }],
  openGraph: {
    title: "Arjun Vashishtha — Full-Stack Developer & AI Builder",
    description: "Building autonomous AI agents, full-stack apps, and data-driven solutions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} ${jetbrainsMono.variable} ${anton.variable} ${bebasNeue.variable} ${vt323.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
