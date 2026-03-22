import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const plusJakartaSans = localFont({
  src: [
    {
      path: "../../public/fonts/plus-jakarta-sans/plus-jakarta-sans-latin.woff2",
      weight: "400 700",
      style: "normal"
    }
  ],
  display: "swap"
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
      <body suppressHydrationWarning className={plusJakartaSans.className}>{children}</body>
    </html>
  );
}
