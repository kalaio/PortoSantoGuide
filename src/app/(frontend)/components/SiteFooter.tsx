import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="bg-[var(--psg-sand-shell)] px-4 py-8 text-center text-black">
      <Image
        src="/branding/porto-santo-guide.svg"
        alt="Porto Santo Guide"
        width={90}
        height={77}
        loading="eager"
        className="mx-auto mb-4 h-auto w-[90px]"
      />
      <p className="m-0 text-sm">© 2026 Porto Santo Guide. All rights reserved.</p>
    </footer>
  );
}
