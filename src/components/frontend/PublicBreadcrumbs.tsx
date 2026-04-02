import Link from "next/link";
import { ChevronRight, HomeLine } from "@untitledui/icons";
import { cx } from "@/utils/cx";

type PublicBreadcrumbItem = {
  href?: string;
  label: string;
};

type PublicBreadcrumbsProps = {
  className?: string;
  items: PublicBreadcrumbItem[];
};

export default function PublicBreadcrumbs({ className, items }: PublicBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={cx("flex flex-wrap items-center gap-1.5 text-sm text-[color:var(--psg-text-secondary)]", className)}>
        <li className="inline-flex items-center gap-1.5">
          <Link href="/" aria-label="Home" className="inline-flex items-center text-black/35 transition-colors hover:!text-black">
            <HomeLine aria-hidden="true" className="h-4 w-4" />
          </Link>
          {items.length > 0 ? <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-[color:var(--psg-text-secondary)]" /> : null}
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link href={item.href} className="text-black/55 transition-colors hover:!text-black">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-black" : undefined}>
                  {item.label}
                </span>
              )}

              {!isLast ? <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-[color:var(--psg-text-secondary)]" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
