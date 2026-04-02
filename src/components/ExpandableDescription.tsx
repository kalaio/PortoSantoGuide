"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type ExpandableDescriptionProps = {
  className?: string;
  text: string;
  truncateAt?: number;
};

export default function ExpandableDescription({ className, text, truncateAt = 180 }: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const normalizedText = text.trim();
  const isTruncated = normalizedText.length > truncateAt;
  const visibleText = !isTruncated || isExpanded ? normalizedText : `${normalizedText.slice(0, truncateAt).trimEnd()}...`;

  return (
    <div className="grid gap-2">
      <p className={cn("text-sm text-black", className)}>{visibleText}</p>

      {isTruncated ? (
        <button
          type="button"
          aria-expanded={isExpanded}
          className="inline-flex w-fit items-center text-sm font-semibold text-black underline decoration-black/30 underline-offset-4 transition hover:decoration-black"
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
        >
          {isExpanded ? "Ver menos" : "Ver mais"}
        </button>
      ) : null}
    </div>
  );
}
