import type { Metadata } from "next";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Porto Santo Guide",
  description: "Porto Santo Guide helps locals and visitors discover where to eat and what to do."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://tiles.stadiamaps.com" />
        <link rel="preconnect" href="https://tiles.stadiamaps.com" crossOrigin="anonymous" />
        <link 
          rel="preload" 
          href="/fonts/plus-jakarta-sans/plus-jakarta-sans-latin.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous"
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-gray-25 text-gray-900 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
