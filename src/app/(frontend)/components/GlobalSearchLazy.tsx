"use client";

import dynamic from "next/dynamic";
import { SearchMd } from "@untitledui/icons";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import PublicSearchInput from "@/components/frontend/PublicSearchInput";

type GlobalSearchLazyProps = {
  compactOnMobile?: boolean;
  placeholder?: string;
};

let globalSearchImportPromise: Promise<typeof import("@/app/(frontend)/components/GlobalSearch")> | null = null;

function loadGlobalSearchInteractive() {
  if (!globalSearchImportPromise) {
    globalSearchImportPromise = import("@/app/(frontend)/components/GlobalSearch");
  }

  return globalSearchImportPromise;
}

const GlobalSearchInteractive = dynamic(loadGlobalSearchInteractive, {
  ssr: false,
  loading: () => null
});

export default function GlobalSearchLazy({ compactOnMobile = false, placeholder = "What are you looking for?" }: GlobalSearchLazyProps) {
  const pathname = usePathname();
  const isHomeRoute = pathname === "/";
  const [isActivated, setIsActivated] = useState(false);
  const [isInteractiveReady, setIsInteractiveReady] = useState(false);

  const preloadInteractive = useCallback(() => {
    if (isInteractiveReady) {
      return Promise.resolve();
    }

    return loadGlobalSearchInteractive().then(() => {
      setIsInteractiveReady(true);
    });
  }, [isInteractiveReady]);

  useEffect(() => {
    if (typeof window === "undefined" || compactOnMobile) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleCallbackId: number | null = null;

    if ("requestIdleCallback" in window) {
      idleCallbackId = window.requestIdleCallback(() => {
        preloadInteractive().catch(() => {});
      });
    } else {
      timeoutId = globalThis.setTimeout(() => {
        preloadInteractive().catch(() => {});
      }, 250);
    }

    return () => {
      if (timeoutId !== null) {
        globalThis.clearTimeout(timeoutId);
      }

      if (idleCallbackId !== null) {
        window.cancelIdleCallback(idleCallbackId);
      }
    };
  }, [compactOnMobile, preloadInteractive]);

  const handleActivate = useCallback(() => {
    preloadInteractive()
      .then(() => {
        setIsActivated(true);
      })
      .catch(() => {});
  }, [preloadInteractive]);

  if (isActivated && isInteractiveReady) {
    return <GlobalSearchInteractive autoOpenOnMount compactOnMobile={compactOnMobile} placeholder={placeholder} />;
  }

  return (
    <>
      {compactOnMobile ? (
        <button
          type="button"
          className="hidden h-11 w-11 items-center justify-center rounded-full bg-transparent text-black transition hover:text-[var(--psg-brand)] cursor-pointer max-[640px]:inline-flex"
          onClick={handleActivate}
          aria-label="Open search"
        >
          <SearchMd className="h-5.5 w-5.5" aria-hidden="true" />
        </button>
      ) : null}

      <div
        className={cn("relative w-full", isHomeRoute ? "max-w-[44rem]" : "max-w-[35rem]", compactOnMobile && "max-[640px]:hidden")}
        onMouseEnter={() => {
          preloadInteractive().catch(() => {});
        }}
        onTouchStartCapture={() => {
          preloadInteractive().catch(() => {});
        }}
      >
        <PublicSearchInput
          className="flex-1"
          onChange={() => {}}
          onFocus={handleActivate}
          placeholder={placeholder}
          showClear={false}
          value=""
          variant={isHomeRoute ? "hero" : "header"}
        />
      </div>
    </>
  );
}
