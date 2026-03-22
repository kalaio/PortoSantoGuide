import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="genericFooter">
      <Image
        src="/branding/porto-santo-guide.svg"
        alt="Porto Santo Guide"
        width={90}
        height={77}
        loading="lazy"
      />
      <p>© 2026 Porto Santo Guide. All rights reserved.</p>
    </footer>
  );
}
