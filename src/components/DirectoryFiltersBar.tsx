"use client";

import { ArrowLeft } from "@untitledui/icons";
import MultiCheckboxFilterPopover from "@/app/(frontend)/components/MultiCheckboxFilterPopover";
import PublicFilterButton from "@/components/frontend/PublicFilterButton";
import { cn } from "@/lib/cn";

type FilterOption = {
  label: string;
  value: string;
};

type DirectoryFiltersBarProps = {
  cuisineFilterOptions: FilterOption[];
  isMobileMapMode: boolean;
  isOpenNowOnly: boolean;
  onBackToList: () => void;
  onToggleOpenNowOnly: () => void;
  selectedCuisines: string[];
  setSelectedCuisines: (next: string[]) => void;
  supportsOpenNowFilter: boolean;
};

export default function DirectoryFiltersBar({
  cuisineFilterOptions,
  isMobileMapMode,
  isOpenNowOnly,
  onBackToList,
  onToggleOpenNowOnly,
  selectedCuisines,
  setSelectedCuisines,
  supportsOpenNowFilter,
}: DirectoryFiltersBarProps) {
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
            onClick={onBackToList}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          </button>
        ) : null}

        <div className={cn("flex items-center gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide", isMobileMapMode ? "min-w-0 flex-1" : "w-full") }>
          {supportsOpenNowFilter ? (
            <PublicFilterButton
              aria-pressed={isOpenNowOnly}
              className="shrink-0"
              isActive={isOpenNowOnly}
              onClick={onToggleOpenNowOnly}
              size="md"
            >
              Open now
            </PublicFilterButton>
          ) : null}
          {cuisineFilterOptions.length > 0 ? (
            <MultiCheckboxFilterPopover
              label="Cuisine"
              onChange={setSelectedCuisines}
              options={cuisineFilterOptions}
              value={selectedCuisines}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
