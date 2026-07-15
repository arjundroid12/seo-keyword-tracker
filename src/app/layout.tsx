import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SEO Keyword Tracker — Find Keywords for Any Restaurant",
  description:
    "AI generates 30+ targeted keywords with search volume, difficulty, and ranking estimates. Track monthly progress. Integrates with Google Search Console and Analytics.",
  applicationName: "SEO Keyword Tracker",
  authors: [{ name: "Arjun Vashishtha" }],
  keywords: [
    "SEO", "keyword tracker", "restaurant SEO", "Google Search Console",
    "Google Analytics", "AI keyword generator", "Z.AI GLM-4.5",
  ],
  openGraph: {
    title: "SEO Keyword Tracker — Find Keywords for Any Restaurant",
    description:
      "AI generates 30+ targeted keywords with search volume, difficulty, and ranking estimates. Track monthly progress.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SEO Keyword Tracker",
    description: "AI-powered SEO keyword research for restaurants.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-[#0a0a0f] text-gray-100 antialiased min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
