"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, SearchMd } from "@untitledui/icons";
import { usePathname, useRouter } from "next/navigation";
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import { cn } from "@/lib/cn";
import { getListingPath } from "@/lib/listing-path";
import PublicSearchInput from "@/components/frontend/PublicSearchInput";

type SearchSuggestion = {
  id: string;
  label: string;
  query: string;
};

type SearchResult = {
  coverPhoto: {
    alt: string | null;
    path: string;
    thumbnailPath: string | null;
  } | null;
  id: string;
  openingStatus: string | null;
  slug: string;
  summary: string;
  title: string;
  primaryCategory: {
    slug: string;
    label: string;
  };
};

type SearchResponse = {
  suggestions: SearchSuggestion[];
  results: SearchResult[];
};

type RecentSearchItem = {
  categoryLabel: string;
  coverPhotoPath: string | null;
  href: string;
  id: string;
  subtitle: string;
  title: string;
};

type PreparedSearchResult = {
  coverPhotoPath: string | null;
  href: string;
  id: string;
  openingStatus: string | null;
  primaryCategoryLabel: string;
  summary: string;
  subtitle: string;
  title: string;
};

const MIN_SEARCH_CHARACTERS = 2;
const SEARCH_DEBOUNCE_MS = 280;
const SUGGESTIONS_CACHE_TTL_MS = 60 * 1000;
const RECENT_SEARCHES_STORAGE_KEY = "porto-santo-guide:recent-searches";
const RECENT_SEARCHES_LIMIT = 4;

type GlobalSearchProps = {
  autoOpenOnMount?: boolean;
  compactOnMobile?: boolean;
  placeholder?: string;
};

function buildRecentSearchSubtitle(categoryLabel: string, summary: string) {
  return summary ? `${categoryLabel} · ${summary}` : categoryLabel;
}

function isRecentSearchItem(value: unknown): value is RecentSearchItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    "categoryLabel" in value &&
    typeof value.categoryLabel === "string" &&
    "coverPhotoPath" in value &&
    (typeof value.coverPhotoPath === "string" || value.coverPhotoPath === null) &&
    "href" in value &&
    typeof value.href === "string" &&
    "id" in value &&
    typeof value.id === "string" &&
    "subtitle" in value &&
    typeof value.subtitle === "string" &&
    "title" in value &&
    typeof value.title === "string"
  );
}

function SearchListingRow({
  coverPhotoPath,
  href,
  isPending,
  onClick,
  subtitle,
  title,
}: {
  coverPhotoPath: string | null;
  href: string;
  isPending: boolean;
  onClick: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
  subtitle: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 rounded-[1rem] border border-transparent px-3 py-3 text-left transition hover:border-[color:var(--psg-accent-surface)] hover:bg-[var(--psg-accent-surface-soft)]",
        isPending && "pointer-events-none opacity-75"
      )}
      onClick={onClick}
      aria-disabled={isPending}
    >
      <div className="relative h-14 w-14 overflow-hidden rounded-[0.875rem] bg-black/5">
        {coverPhotoPath ? (
          <Image src={coverPhotoPath} alt="" fill sizes="56px" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs font-semibold text-black/40">PS</div>
        )}
      </div>
      <div className="grid min-w-0 gap-0.5">
        <strong className="inline-flex items-center gap-2 truncate text-md font-semibold text-black">
          <span className="truncate">{title}</span>
          {isPending ? <span className="routeSpinner" aria-hidden="true" /> : null}
        </strong>
        <span className="truncate text-sm text-[color:var(--psg-text-secondary)]">{subtitle}</span>
      </div>
    </Link>
  );
}

function SearchListingRowSkeleton() {
  return (
    <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 rounded-[1rem] px-3 py-3">
      <div className="h-14 w-14 animate-pulse rounded-[0.875rem] bg-black/6" />
      <div className="grid gap-2">
        <div className="h-5 w-40 animate-pulse rounded-full bg-black/8" />
        <div className="h-4 w-56 animate-pulse rounded-full bg-black/6" />
      </div>
    </div>
  );
}

export default function GlobalSearch({ autoOpenOnMount = false, compactOnMobile = false, placeholder = "What are you looking for?" }: GlobalSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHomeRoute = pathname === "/";
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsCacheRef = useRef<{ data: SearchSuggestion[]; loadedAt: number } | null>(null);
  const searchRequestRef = useRef(0);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const suggestionsOpenRequestRef = useRef(0);
  const wasOpenRef = useRef(false);
  const autoOpenedRef = useRef(false);
  const isApplyingSuggestionRef = useRef(false);
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [displayMode, setDisplayMode] = useState<"suggestions" | "results">("suggestions");
  const [lastCompletedQuery, setLastCompletedQuery] = useState("");
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [searchVersion, setSearchVersion] = useState(0);
  const [resultsOpenVersion, setResultsOpenVersion] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingResultId, setPendingResultId] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [routeAtResultClick, setRouteAtResultClick] = useState(pathname);
  const [isResultNavigationPending, startResultNavigation] = useTransition();

  const trimmedQuery = useMemo(() => searchQuery.trim(), [searchQuery]);
  const isShowingResults = displayMode === "results";
  const isDesktopOverlayOpen = isOpen && !isMobileOpen;
  const isDesktopDropdownOpen = isOpen && !isMobileOpen;
  const showDesktopRecentSearches =
    !isMobileOpen && displayMode === "suggestions" && trimmedQuery.length < MIN_SEARCH_CHARACTERS && recentSearches.length > 0;
  const preparedResults = useMemo<PreparedSearchResult[]>(() => {
    return results.map((result) => {
      const subtitle = buildRecentSearchSubtitle(result.primaryCategory.label, result.summary);

      return {
        coverPhotoPath: result.coverPhoto?.thumbnailPath ?? result.coverPhoto?.path ?? null,
        href: getListingPath(result),
        id: result.id,
        openingStatus: result.openingStatus,
        primaryCategoryLabel: result.primaryCategory.label,
        summary: result.summary,
        subtitle,
        title: result.title
      };
    });
  }, [results]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (!storedValue) {
        return;
      }

      const parsedValue = JSON.parse(storedValue);
      if (!Array.isArray(parsedValue)) {
        return;
      }

      setRecentSearches(parsedValue.filter(isRecentSearchItem).slice(0, RECENT_SEARCHES_LIMIT));
    } catch {
      window.localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    }
  }, []);

  const loadAllSuggestions = useCallback(async (force = false) => {
    if (force) {
      suggestionsCacheRef.current = null;
    }

    const cachedSuggestions = suggestionsCacheRef.current;
    const hasFreshCachedSuggestions =
      cachedSuggestions && Date.now() - cachedSuggestions.loadedAt <= SUGGESTIONS_CACHE_TTL_MS;

    if (!force && hasFreshCachedSuggestions) {
      setSuggestions(cachedSuggestions.data);
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/search");
      const payload = (await response.json()) as SearchResponse & { error?: string };

      if (!response.ok) {
        setSuggestions([]);
        setError(payload.error ?? "Could not load suggestions.");
        return;
      }

      const nextSuggestions = payload.suggestions ?? [];
      setSuggestions(nextSuggestions);
      suggestionsCacheRef.current = {
        data: nextSuggestions,
        loadedAt: Date.now()
      };
    } catch {
      setSuggestions([]);
      setError("Could not load suggestions.");
    }
  }, []);

  const openSuggestionsDropdown = useCallback(async (force = false) => {
    const requestId = suggestionsOpenRequestRef.current + 1;
    suggestionsOpenRequestRef.current = requestId;

    await loadAllSuggestions(force);

    if (suggestionsOpenRequestRef.current !== requestId) {
      return;
    }

    if (document.activeElement === inputRef.current) {
      setIsOpen(true);
    }
  }, [loadAllSuggestions]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (isMobileOpen) {
        return;
      }
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        suggestionsOpenRequestRef.current += 1;
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.classList.add("mobileSearchOpen");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove("mobileSearchOpen");
    };
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isDesktopOverlayOpen) {
      return;
    }

    document.body.classList.add("desktopSearchOverlayOpen");

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setIsOpen(false);
      inputRef.current?.blur();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("desktopSearchOverlayOpen");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDesktopOverlayOpen]);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    if (query.trim().length < MIN_SEARCH_CHARACTERS) {
      setDisplayMode("suggestions");
      openSuggestionsDropdown().catch(() => {
        setSuggestions([]);
        setError("Could not load suggestions.");
        setIsOpen(true);
      });
    }
  }, [isMobileOpen, query, openSuggestionsDropdown]);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isMobileOpen]);

  useEffect(() => {
    return () => {
      searchAbortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (trimmedQuery.length < MIN_SEARCH_CHARACTERS) {
      searchAbortControllerRef.current?.abort();
      setIsResultsLoading(false);
      setDisplayMode("suggestions");

      if (trimmedQuery.length === 0) {
        searchRequestRef.current += 1;
        setResults([]);
        setLastCompletedQuery("");
      } else if (trimmedQuery.length > 0) {
        searchRequestRef.current += 1;
      }
      return;
    }

    if (trimmedQuery === lastCompletedQuery) {
      setIsResultsLoading(false);
      return;
    }

    setIsResultsLoading(true);

    const timeoutId = window.setTimeout(async () => {
      const requestId = searchRequestRef.current + 1;
      searchRequestRef.current = requestId;
      searchAbortControllerRef.current?.abort();
      const controller = new AbortController();
      searchAbortControllerRef.current = controller;

      setError("");

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal
        });
        const payload = (await response.json()) as SearchResponse & { error?: string };

        if (requestId !== searchRequestRef.current) {
          return;
        }

        if (!response.ok) {
          setError(payload.error ?? "Could not search.");
          setIsResultsLoading(false);
          setSearchVersion((prev) => prev + 1);
          setDisplayMode("results");
          if (document.activeElement === inputRef.current) {
            setIsOpen(true);
          }
          return;
        }

        setResults(payload.results ?? []);
        setLastCompletedQuery(trimmedQuery);
        setIsResultsLoading(false);
        setSearchVersion((prev) => prev + 1);
        setDisplayMode("results");
        if (document.activeElement === inputRef.current) {
          setIsOpen(true);
        }
      } catch {
        if (controller.signal.aborted || requestId !== searchRequestRef.current) {
          return;
        }

        setError("Could not search.");
        setIsResultsLoading(false);
        setSearchVersion((prev) => prev + 1);
        setDisplayMode("results");
        if (document.activeElement === inputRef.current) {
          setIsOpen(true);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [trimmedQuery, lastCompletedQuery]);

  useEffect(() => {
    if (!wasOpenRef.current && isOpen && isShowingResults) {
      setResultsOpenVersion((prev) => prev + 1);
    }

    wasOpenRef.current = isOpen;
  }, [isOpen, isShowingResults]);

  async function runSuggestionQuery(suggestion: SearchSuggestion) {
    const shouldReuseCurrentResults = suggestion.query.trim() === lastCompletedQuery;

    isApplyingSuggestionRef.current = true;
    setQuery(suggestion.label);
    setSearchQuery(suggestion.query);
    setError("");
    setDisplayMode("results");
    if (!shouldReuseCurrentResults) {
      setResults([]);
    }
    setIsResultsLoading(!shouldReuseCurrentResults);
    setIsOpen(true);

    if (document.activeElement !== inputRef.current) {
      inputRef.current?.focus();
    }
  }

  function clearQuery() {
    searchRequestRef.current += 1;
    searchAbortControllerRef.current?.abort();
    setQuery("");
    setSearchQuery("");
    setDisplayMode("suggestions");
    setResults([]);
    setError("");
    setIsResultsLoading(false);
    setLastCompletedQuery("");

    openSuggestionsDropdown().catch(() => {
      setSuggestions([]);
      setError("Could not load suggestions.");
      setIsOpen(true);
    });

    inputRef.current?.focus();
  }

  const closeMobileOverlay = () => {
    setIsMobileOpen(false);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const openMobileOverlay = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const isMobileViewport = useCallback(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches,
    []
  );

  useEffect(() => {
    if (!autoOpenOnMount || autoOpenedRef.current) {
      return;
    }

    autoOpenedRef.current = true;

    if (isMobileViewport()) {
      setIsMobileOpen(true);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();

      if (query.trim().length === 0) {
        setDisplayMode("suggestions");
        openSuggestionsDropdown().catch(() => {
          setSuggestions([]);
          setError("Could not load suggestions.");
          setIsOpen(true);
        });
        return;
      }

      setIsOpen(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [autoOpenOnMount, isMobileViewport, openSuggestionsDropdown, query]);

  const persistRecentSearch = useCallback((result: PreparedSearchResult, href: string) => {
    const nextItem: RecentSearchItem = {
      categoryLabel: result.primaryCategoryLabel,
      coverPhotoPath: result.coverPhotoPath,
      href,
      id: result.id,
      subtitle: buildRecentSearchSubtitle(result.primaryCategoryLabel, result.summary),
      title: result.title
    };

    setRecentSearches((currentValue) => {
      const nextValue = [nextItem, ...currentValue.filter((item) => item.id !== nextItem.id)].slice(0, RECENT_SEARCHES_LIMIT);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(nextValue));
      }

      return nextValue;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPendingResultId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!pendingResultId) {
      return;
    }

    if (pathname !== routeAtResultClick) {
      setPendingResultId(null);
      setRouteAtResultClick(pathname);
      setIsOpen(false);

      if (isMobileOpen) {
        setIsMobileOpen(false);
        inputRef.current?.blur();
      }
    }
  }, [isMobileOpen, pathname, pendingResultId, routeAtResultClick]);

  const handleListingNavigation = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    item: { href: string; id: string },
    result?: PreparedSearchResult
  ) => {
    event.preventDefault();

    if (isResultNavigationPending) {
      return;
    }

    const href = item.href;
    if (href === pathname) {
      setPendingResultId(null);
      setIsOpen(false);
      if (isMobileOpen) {
        closeMobileOverlay();
      }
      return;
    }

    if (result) {
      persistRecentSearch(result, href);
    }

    setPendingResultId(item.id);
    setRouteAtResultClick(pathname);

    startResultNavigation(() => {
      router.push(href);
    });
  };

  const searchContent = (
    <>
      <div className={cn("flex items-center", isMobileOpen && "gap-3")}>
        {isMobileOpen ? (
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[color:var(--psg-text-secondary)] transition hover:border-[var(--psg-brand)] hover:text-[var(--psg-brand)] cursor-pointer"
            onClick={closeMobileOverlay}
            aria-label="Close"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}

        <PublicSearchInput
          className="flex-1"
          inputRef={inputRef}
          isDesktopOpen={isDesktopDropdownOpen}
          isMobile={isMobileOpen}
          onChange={(nextValue) => {
            setQuery(nextValue);
            setSearchQuery(nextValue);
            const trimmed = nextValue.trim();
            if (trimmed.length === 0) {
              searchAbortControllerRef.current?.abort();
              searchRequestRef.current += 1;
              setResults([]);
              setError("");
              setLastCompletedQuery("");
              setDisplayMode("suggestions");
              openSuggestionsDropdown().catch(() => {
                setSuggestions([]);
                setError("Could not load suggestions.");
                setIsOpen(true);
              });
              return;
            }

            if (trimmed.length < MIN_SEARCH_CHARACTERS) {
              searchAbortControllerRef.current?.abort();
              searchRequestRef.current += 1;
              setError("");
              setDisplayMode("suggestions");
              openSuggestionsDropdown().catch(() => {
                setSuggestions([]);
                setError("Could not load suggestions.");
                setIsOpen(true);
              });
              return;
            }

            setError("");
            if (trimmed === lastCompletedQuery) {
              setDisplayMode("results");
              setIsOpen(true);
            }
          }}
          onClear={clearQuery}
          onFocus={() => {
            if (isApplyingSuggestionRef.current) {
              isApplyingSuggestionRef.current = false;
              return;
            }

            if (isMobileViewport()) {
              setIsMobileOpen(true);
            }

            if (query.trim().length < MIN_SEARCH_CHARACTERS) {
              setDisplayMode("suggestions");
              openSuggestionsDropdown().catch(() => {
                setSuggestions([]);
                setError("Could not load suggestions.");
                setIsOpen(true);
              });
              return;
            }

            if (displayMode === "results") {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          showClear={query.trim().length > 0}
          value={query}
          variant={isHomeRoute ? "hero" : "header"}
        />
      </div>

      {isOpen ? (
        <div
          key={isShowingResults ? `results-${searchVersion}-${resultsOpenVersion}` : "suggestions"}
          className={cn(
            "overflow-hidden bg-white",
            isMobileOpen
              ? "min-h-0 rounded-[1.5rem] border border-black/10 shadow-[0_28px_70px_-30px_rgba(10,13,18,0.35)]"
              : "absolute left-0 right-0 top-[calc(100%-1px)] z-50 rounded-b-[1.5rem]"
          )}
        >
          <div className={cn("max-h-[min(70vh,34rem)] overflow-y-auto", isMobileOpen ? "px-3 py-3" : "border-t border-black/10 px-4 py-4") }>
            {error ? <p className="px-2 py-2 text-sm text-error-600">{error}</p> : null}

            {displayMode === "suggestions" ? (
              <div className="grid gap-5">
                <section className="grid gap-1">
                  <p className="px-2 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.14em] text-black">Suggestions</p>
                  {suggestions.length === 0 ? (
                    <p className="px-2 py-2 text-sm text-[color:var(--psg-text-secondary)]">No suggestions yet.</p>
                  ) : (
                    suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        className={cn(
                          "cursor-pointer rounded-[1rem] text-left transition hover:bg-[var(--psg-accent-surface-soft)]",
                          isMobileOpen ? "px-4 py-3 text-md text-black" : "grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-3 px-3 py-3.5 text-md font-medium text-black"
                        )}
                        type="button"
                        onClick={() => runSuggestionQuery(suggestion)}
                      >
                        {!isMobileOpen ? <SearchMd className="h-5 w-5 text-black/45" aria-hidden="true" /> : null}
                        <span>{suggestion.label}</span>
                      </button>
                    ))
                  )}
                </section>

                {showDesktopRecentSearches ? (
                  <section className="grid gap-2 border-t border-black/10 pt-4">
                    <p className="px-2 pb-1 text-base font-semibold text-black">Recently viewed</p>
                    <div className="grid gap-1">
                      {recentSearches.map((item) => (
                        <SearchListingRow
                          key={item.id}
                          coverPhotoPath={item.coverPhotoPath}
                          href={item.href}
                          isPending={pendingResultId === item.id}
                          onClick={(event) => handleListingNavigation(event, { href: item.href, id: item.id })}
                          subtitle={item.subtitle}
                          title={item.title}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-1" aria-busy={isResultNavigationPending}>
                {isResultsLoading ? (
                  <>
                    <SearchListingRowSkeleton />
                    <SearchListingRowSkeleton />
                    <SearchListingRowSkeleton />
                  </>
                ) : null}

                {!isResultsLoading && results.length === 0 && lastCompletedQuery.length > 0 ? (
                  <p className="px-2 py-2 text-sm text-[color:var(--psg-text-secondary)]">No matching places.</p>
                ) : null}

                {!isResultsLoading && preparedResults.map((result) => {
                  return (
                    !isMobileOpen ? (
                      <SearchListingRow
                        key={result.id}
                        coverPhotoPath={result.coverPhotoPath}
                        href={result.href}
                        isPending={pendingResultId === result.id}
                        onClick={(event) => handleListingNavigation(event, { href: result.href, id: result.id }, result)}
                        subtitle={result.openingStatus ? `${result.subtitle} · ${result.openingStatus}` : result.subtitle}
                        title={result.title}
                      />
                    ) : (
                      <Link
                        key={result.id}
                        href={result.href}
                        className={cn(
                          "grid gap-0 rounded-[1rem] border border-transparent px-4 py-3 text-left transition hover:border-[color:var(--psg-accent-surface)] hover:bg-[var(--psg-accent-surface-soft)]",
                          pendingResultId === result.id && "pointer-events-none opacity-75"
                        )}
                        onClick={(event) => handleListingNavigation(event, { href: result.href, id: result.id }, result)}
                        aria-disabled={isResultNavigationPending}
                      >
                        <strong className="inline-flex items-center gap-2 text-md font-semibold text-black">
                          {result.title}
                          {pendingResultId === result.id ? <span className="routeSpinner" aria-hidden="true" /> : null}
                        </strong>
                        <span className="text-sm text-[color:var(--psg-text-secondary)]">{result.primaryCategoryLabel}</span>
                        {result.openingStatus ? (
                          <span className="text-sm text-[color:var(--psg-text-secondary)]">{result.openingStatus}</span>
                        ) : null}
                        {result.summary ? (
                          <span className="text-sm text-[color:var(--psg-text-secondary)]">{result.summary}</span>
                        ) : null}
                      </Link>
                    )
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      {isDesktopOverlayOpen ? <div className="fixed inset-0 z-40 bg-black/40" aria-hidden="true" /> : null}

      {compactOnMobile && !isMobileOpen ? (
        <button
          type="button"
          className="hidden h-11 w-11 items-center justify-center rounded-full bg-transparent text-black transition hover:text-[var(--psg-brand)] cursor-pointer max-[640px]:inline-flex"
          onClick={openMobileOverlay}
          aria-label="Open search"
        >
          <SearchMd className="h-5.5 w-5.5" aria-hidden="true" />
        </button>
      ) : null}

      <div
        className={cn(
          isMobileOpen
            ? "fixed inset-0 z-[9999] flex max-w-none flex-col gap-4 bg-white px-4 py-4"
            : cn("relative w-full", isHomeRoute ? "max-w-[44rem]" : "max-w-[35rem]", isDesktopOverlayOpen && "z-50"),
          compactOnMobile && !isMobileOpen && "max-[640px]:hidden"
        )}
        ref={isMobileOpen ? undefined : rootRef}
      >
        {searchContent}
      </div>
    </>
  );
}
