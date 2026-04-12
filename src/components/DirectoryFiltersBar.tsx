"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "@untitledui/icons";
import MultiCheckboxFilterPopover from "@/app/(frontend)/components/MultiCheckboxFilterPopover";
import PublicFilterButton from "@/components/frontend/PublicFilterButton";
import { cn } from "@/lib/cn";

export type DirectoryFilterOption = {
  label: string;
  value: string;
};

export type DirectoryFrontendFilter =
  | {
      key: string;
      type: "toggle";
      label: string;
      isActive: boolean;
      onToggle: () => void;
    }
  | {
      key: string;
      type: "multi-select";
      label: string;
      options: DirectoryFilterOption[];
      value: string[];
      onChange: (next: string[]) => void;
    };

type DirectoryFiltersBarProps = {
  filters: DirectoryFrontendFilter[];
  isMobileMapMode: boolean;
  onBackToList: () => void;
};

export default function DirectoryFiltersBar({
  filters,
  isMobileMapMode,
  onBackToList
}: DirectoryFiltersBarProps) {
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);

  useEffect(() => {
    if (openFilterKey !== null && !filters.some((filter) => filter.key === openFilterKey)) {
      setOpenFilterKey(null);
    }
  }, [filters, openFilterKey]);

  return (
    <div
      aria-label="Archive filters"
      className={cn("w-full border-b border-black/10 bg-white", isMobileMapMode ? "fixed inset-x-0 top-0 z-40" : "sticky top-0 z-30")}
      role="region"
    >
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-3 px-4 md:px-5 max-[900px]:h-[60px]">
        {isMobileMapMode ? (
          <button
            aria-label="Show list"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[color:var(--psg-text-secondary)] transition hover:border-[var(--psg-brand)] hover:text-[var(--psg-brand)] cursor-pointer"
            onClick={() => {
              setOpenFilterKey(null);
              onBackToList();
            }}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : null}

        <div className={cn("flex items-center gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide", isMobileMapMode ? "min-w-0 flex-1" : "w-full") }>
          {filters.map((filter) => {
            if (filter.type === "toggle") {
              return (
                <PublicFilterButton
                  key={filter.key}
                  aria-pressed={filter.isActive}
                  className="shrink-0"
                  isActive={filter.isActive}
                  onClick={() => {
                    setOpenFilterKey(null);
                    filter.onToggle();
                  }}
                  size="md"
                >
                  {filter.label}
                </PublicFilterButton>
              );
            }

            return (
              <MultiCheckboxFilterPopover
                key={filter.key}
                isOpen={openFilterKey === filter.key}
                label={filter.label}
                onChange={filter.onChange}
                onOpenChange={(next) => {
                  setOpenFilterKey(next ? filter.key : (currentKey) => (currentKey === filter.key ? null : currentKey));
                }}
                options={filter.options}
                value={filter.value}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
