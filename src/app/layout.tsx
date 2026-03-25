import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppProviders from "@/components/providers/AppProviders";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

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
      </head>
      <body suppressHydrationWarning className={`${inter.variable} min-h-screen bg-gray-25 font-body text-gray-900 antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
