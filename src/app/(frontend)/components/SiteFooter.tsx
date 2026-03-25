import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="border-t border-secondary bg-secondary px-4 py-8 text-center text-gray-900">
      <Image
        src="/branding/porto-santo-guide.svg"
        alt="Porto Santo Guide"
        width={90}
        height={77}
        loading="eager"
        className="mx-auto mb-4 h-auto w-[90px]"
      />
      <p className="m-0 text-xl max-[640px]:text-base">© 2026 Porto Santo Guide. All rights reserved.</p>
    </footer>
  );
}
